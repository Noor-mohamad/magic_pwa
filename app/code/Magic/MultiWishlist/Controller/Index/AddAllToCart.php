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
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem\CollectionFactory as ItemCollectionFactory;
use Magic\MultiWishlist\Model\WishlistFactory;

class AddAllToCart extends AbstractAction
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource,
        private readonly ItemCollectionFactory $itemCollectionFactory,
        private readonly ProductFactory $productFactory,
        private readonly Cart $cart,
        private readonly JsonFactory $jsonFactory
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Json|Redirect
    {
        $wishlistId = (int) $this->getRequest()->getParam('wishlist_id');

        $wishlist = $this->wishlistFactory->create();
        $this->wishlistResource->load($wishlist, $wishlistId);

        if (!$wishlist->getId() || $wishlist->getCustomerId() !== $this->getCustomerId()) {
            return $this->respond(false, 'Wishlist not found.', null);
        }

        $items  = $this->itemCollectionFactory->create()->addFieldToFilter('wishlist_id', $wishlistId);
        $added  = 0;
        $failed = 0;

        foreach ($items as $item) {
            $product = $this->productFactory->create()->load($item->getProductId());
            if (!$product->getId()) {
                $failed++;
                continue;
            }
            try {
                $this->cart->addProduct($product, ['qty' => max(1, $item->getQty())]);
                $added++;
            } catch (\Exception) {
                $failed++;
            }
        }

        if ($added > 0) {
            $this->cart->save();
        }

        $message = $failed > 0
            ? (string) __('%1 item(s) added to cart. %2 item(s) could not be added (may require option selection).', $added, $failed)
            : (string) __('%1 item(s) have been added to your cart.', $added);

        if ($this->getRequest()->isAjax()) {
            return $this->jsonFactory->create()->setData([
                'success' => $added > 0,
                'message' => $message,
            ]);
        }

        if ($added > 0) {
            $this->messageManager->addSuccessMessage($message);
            return $this->resultRedirectFactory->create()->setPath('checkout/cart');
        }

        $this->messageManager->addErrorMessage($message);
        return $this->resultRedirectFactory->create()->setPath(
            'multiwishlist/index/view',
            ['wishlist_id' => $wishlistId]
        );
    }

    private function respond(bool $success, string $message, ?int $wishlistId): Json|Redirect
    {
        if ($this->getRequest()->isAjax()) {
            return $this->jsonFactory->create()->setData(['success' => $success, 'message' => $message]);
        }
        $this->messageManager->addErrorMessage(__($message));
        return $this->resultRedirectFactory->create()->setPath('multiwishlist');
    }
}
