<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Math\Random;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;
use Magic\MultiWishlist\Model\WishlistFactory;

class Create extends AbstractAction implements HttpPostActionInterface
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource,
        private readonly JsonFactory $jsonFactory,
        private readonly Random $mathRandom
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Json|Redirect
    {
        $name = trim((string) $this->getRequest()->getParam('wishlist_name'));

        if ($name === '') {
            if ($this->getRequest()->isAjax()) {
                return $this->jsonFactory->create()->setData([
                    'success' => false,
                    'message' => (string) __('Wishlist name is required.'),
                ]);
            }
            $this->messageManager->addErrorMessage(__('Wishlist name is required.'));
            return $this->resultRedirectFactory->create()->setPath('multiwishlist');
        }

        try {
            $wishlist = $this->wishlistFactory->create();
            $wishlist->setCustomerId($this->getCustomerId());
            $wishlist->setWishlistName($name);
            $wishlist->setIsDefault(0);
            $wishlist->setShared(0);
            $wishlist->setSharingCode($this->mathRandom->getUniqueHash());
            $this->wishlistResource->save($wishlist);

            if ($this->getRequest()->isAjax()) {
                return $this->jsonFactory->create()->setData([
                    'success'       => true,
                    'message'       => (string) __('Wishlist "%1" created.', $name),
                    'wishlist_id'   => $wishlist->getId(),
                    'wishlist_name' => $wishlist->getWishlistName(),
                ]);
            }
            $this->messageManager->addSuccessMessage(__('Wishlist "%1" has been created.', $name));
        } catch (\Exception) {
            if ($this->getRequest()->isAjax()) {
                return $this->jsonFactory->create()->setData([
                    'success' => false,
                    'message' => (string) __('Could not create wishlist.'),
                ]);
            }
            $this->messageManager->addErrorMessage(__('Could not create wishlist.'));
        }

        return $this->resultRedirectFactory->create()->setPath('multiwishlist');
    }
}
