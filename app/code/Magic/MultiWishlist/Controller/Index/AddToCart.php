<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Catalog\Model\ProductFactory;
use Magento\Checkout\Model\Cart;
use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Controller\Result\Redirect;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem as WishlistItemResource;
use Magic\MultiWishlist\Model\WishlistFactory;
use Magic\MultiWishlist\Model\WishlistItemFactory;

class AddToCart extends AbstractAction
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly WishlistItemFactory $itemFactory,
        private readonly WishlistItemResource $itemResource,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource,
        private readonly ProductFactory $productFactory,
        private readonly Cart $cart,
        private readonly JsonFactory $jsonFactory
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Json|Redirect
    {
        $itemId = (int) $this->getRequest()->getParam('item_id');

        $item = $this->itemFactory->create();
        $this->itemResource->load($item, $itemId);

        if (!$item->getId()) {
            return $this->respond(false, 'Item not found.', null);
        }

        $wishlist = $this->wishlistFactory->create();
        $this->wishlistResource->load($wishlist, $item->getWishlistId());

        if (!$wishlist->getId() || $wishlist->getCustomerId() !== $this->getCustomerId()) {
            return $this->respond(false, 'Item not found.', null);
        }

        $product = $this->productFactory->create()->load($item->getProductId());
        if (!$product->getId()) {
            return $this->respond(false, 'Product not found.', $wishlist->getId());
        }

        try {
            $this->cart->addProduct($product, ['qty' => max(1, $item->getQty())]);
            $this->cart->save();

            if ($this->getRequest()->isAjax()) {
                return $this->jsonFactory->create()->setData([
                    'success' => true,
                    'message' => (string) __('"%1" has been added to your cart.', $product->getName()),
                ]);
            }
            $this->messageManager->addSuccessMessage(
                __('"%1" has been added to your cart.', $product->getName())
            );
            return $this->resultRedirectFactory->create()->setPath('checkout/cart');
        } catch (\Magento\Framework\Exception\LocalizedException $e) {
            return $this->respond(false, $e->getMessage(), $wishlist->getId());
        } catch (\Exception) {
            return $this->respond(false, 'Could not add product to cart.', $wishlist->getId());
        }
    }

    private function respond(bool $success, string $message, ?int $wishlistId): Json|Redirect
    {
        if ($this->getRequest()->isAjax()) {
            return $this->jsonFactory->create()->setData([
                'success' => $success,
                'message' => (string) __($message),
            ]);
        }
        if ($success) {
            $this->messageManager->addSuccessMessage(__($message));
        } else {
            $this->messageManager->addErrorMessage(__($message));
        }
        $path = $wishlistId
            ? 'multiwishlist/index/view'
            : 'multiwishlist';
        $params = $wishlistId ? ['wishlist_id' => $wishlistId] : [];
        return $this->resultRedirectFactory->create()->setPath($path, $params);
    }
}
