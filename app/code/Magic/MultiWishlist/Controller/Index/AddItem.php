<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Exception\NoSuchEntityException;
use Magic\MultiWishlist\Model\PriceAlertFactory;
use Magic\MultiWishlist\Model\ResourceModel\PriceAlert as PriceAlertResource;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem as WishlistItemResource;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem\CollectionFactory as ItemCollectionFactory;
use Magic\MultiWishlist\Model\WishlistFactory;
use Magic\MultiWishlist\Model\WishlistItemFactory;

class AddItem extends AbstractAction implements HttpPostActionInterface
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource,
        private readonly WishlistItemFactory $itemFactory,
        private readonly WishlistItemResource $itemResource,
        private readonly ItemCollectionFactory $itemCollectionFactory,
        private readonly PriceAlertFactory $alertFactory,
        private readonly PriceAlertResource $alertResource,
        private readonly ProductRepositoryInterface $productRepository,
        private readonly JsonFactory $jsonFactory
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Json|Redirect
    {
        $wishlistId = (int) $this->getRequest()->getParam('wishlist_id');
        $productId  = (int) $this->getRequest()->getParam('product_id');
        $qty        = max(0.01, (float) ($this->getRequest()->getParam('qty') ?: 1));
        $comment    = (string) $this->getRequest()->getParam('comment');

        if (!$wishlistId || !$productId) {
            return $this->errorResponse('Invalid request parameters.');
        }

        $wishlist = $this->wishlistFactory->create();
        $this->wishlistResource->load($wishlist, $wishlistId);

        if (!$wishlist->getId() || $wishlist->getCustomerId() !== $this->getCustomerId()) {
            return $this->errorResponse('Wishlist not found.');
        }

        // Prevent duplicates within the same wishlist
        $existing = $this->itemCollectionFactory->create()
            ->addFieldToFilter('wishlist_id', $wishlistId)
            ->addFieldToFilter('product_id', $productId)
            ->setPageSize(1);

        if ($existing->getSize() > 0) {
            return $this->errorResponse('Product is already in this wishlist.');
        }

        try {
            $product = $this->productRepository->getById($productId);
        } catch (NoSuchEntityException) {
            return $this->errorResponse('Product not found.');
        }

        try {
            $item = $this->itemFactory->create();
            $item->setWishlistId($wishlistId);
            $item->setProductId($productId);
            $item->setQty($qty);
            $item->setComment($comment ?: null);
            $this->itemResource->save($item);

            // Record current price for price-drop alerts (Phase 6)
            $alert = $this->alertFactory->create();
            $alert->setData([
                'customer_id'  => $this->getCustomerId(),
                'product_id'   => $productId,
                'wishlist_id'  => $wishlistId,
                'price_at_add' => (float) $product->getFinalPrice(),
                'is_active'    => 1,
            ]);
            $this->alertResource->save($alert);

            if ($this->getRequest()->isAjax()) {
                return $this->jsonFactory->create()->setData([
                    'success' => true,
                    'message' => (string) __('"%1" has been added to your wishlist.', $product->getName()),
                    'item_id' => $item->getId(),
                ]);
            }
            $this->messageManager->addSuccessMessage(
                __('"%1" has been added to your wishlist.', $product->getName())
            );
        } catch (\Exception) {
            return $this->errorResponse('Could not add product to wishlist.');
        }

        return $this->resultRedirectFactory->create()->setPath(
            'multiwishlist/index/view',
            ['wishlist_id' => $wishlistId]
        );
    }

    private function errorResponse(string $message): Json|Redirect
    {
        if ($this->getRequest()->isAjax()) {
            return $this->jsonFactory->create()->setData([
                'success' => false,
                'message' => (string) __($message),
            ]);
        }
        $this->messageManager->addErrorMessage(__($message));
        return $this->resultRedirectFactory->create()->setPath('multiwishlist');
    }
}
