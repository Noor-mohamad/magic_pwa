<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Controller\Result\Redirect;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem as WishlistItemResource;
use Magic\MultiWishlist\Model\WishlistFactory;
use Magic\MultiWishlist\Model\WishlistItemFactory;

class UpdateItem extends AbstractAction implements HttpPostActionInterface
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly WishlistItemFactory $itemFactory,
        private readonly WishlistItemResource $itemResource,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource,
        private readonly JsonFactory $jsonFactory
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Json|Redirect
    {
        $itemId  = (int) $this->getRequest()->getParam('item_id');
        $qty     = max(0.01, (float) ($this->getRequest()->getParam('qty') ?: 1));
        $comment = (string) $this->getRequest()->getParam('comment');

        $item = $this->itemFactory->create();
        $this->itemResource->load($item, $itemId);

        if (!$item->getId()) {
            return $this->jsonResponse(false, 'Item not found.');
        }

        $wishlist = $this->wishlistFactory->create();
        $this->wishlistResource->load($wishlist, $item->getWishlistId());

        if (!$wishlist->getId() || $wishlist->getCustomerId() !== $this->getCustomerId()) {
            return $this->jsonResponse(false, 'Item not found.');
        }

        try {
            $item->setQty($qty);
            $item->setComment($comment ?: null);
            $this->itemResource->save($item);

            if ($this->getRequest()->isAjax()) {
                return $this->jsonResponse(true, 'Item updated.');
            }
            $this->messageManager->addSuccessMessage(__('Item has been updated.'));
        } catch (\Exception) {
            return $this->jsonResponse(false, 'Could not update item.');
        }

        return $this->resultRedirectFactory->create()->setPath(
            'multiwishlist/index/view',
            ['wishlist_id' => $wishlist->getId()]
        );
    }

    private function jsonResponse(bool $success, string $message): Json
    {
        return $this->jsonFactory->create()->setData([
            'success' => $success,
            'message' => (string) __($message),
        ]);
    }
}
