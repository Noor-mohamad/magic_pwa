<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Action\HttpGetActionInterface;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\App\Area;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Mail\Template\TransportBuilder;
use Magento\Framework\View\Result\Page;
use Magento\Framework\View\Result\PageFactory;
use Magento\Store\Model\StoreManagerInterface;
use Magic\MultiWishlist\Helper\Data as WishlistHelper;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;
use Magic\MultiWishlist\Model\Wishlist;
use Magic\MultiWishlist\Model\WishlistFactory;

class Share extends AbstractAction implements HttpGetActionInterface, HttpPostActionInterface
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource,
        private readonly PageFactory $pageFactory,
        private readonly TransportBuilder $transportBuilder,
        private readonly StoreManagerInterface $storeManager,
        private readonly WishlistHelper $helper
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Page|Redirect
    {
        $wishlistId = (int) $this->getRequest()->getParam('wishlist_id');
        $wishlist   = $this->wishlistFactory->create();
        $this->wishlistResource->load($wishlist, $wishlistId);

        if (!$wishlist->getId() || $wishlist->getCustomerId() !== $this->getCustomerId()) {
            $this->messageManager->addErrorMessage(__('Wishlist not found.'));
            return $this->resultRedirectFactory->create()->setPath('multiwishlist');
        }

        if ($this->getRequest()->isPost()) {
            return $this->handlePost($wishlist);
        }

        $page = $this->pageFactory->create();
        $page->getConfig()->getTitle()->set(__('Share Wishlist: %1', $wishlist->getWishlistName()));
        return $page;
    }

    private function handlePost(Wishlist $wishlist): Redirect
    {
        $emailsRaw = (string) $this->getRequest()->getParam('emails', '');
        $message   = trim((string) $this->getRequest()->getParam('message', ''));

        $emails = array_values(array_filter(
            array_map('trim', preg_split('/[\n,]+/', $emailsRaw)),
            static fn(string $e): bool => (bool) filter_var($e, FILTER_VALIDATE_EMAIL)
        ));

        if (empty($emails)) {
            $this->messageManager->addErrorMessage(
                __('Please enter at least one valid email address.')
            );
            return $this->resultRedirectFactory->create()->setPath(
                'multiwishlist/index/share',
                ['wishlist_id' => $wishlist->getId()]
            );
        }

        // Mark wishlist as shared (makes the public share URL live)
        $wishlist->setShared(1);
        $this->wishlistResource->save($wishlist);

        $shareUrl      = $this->helper->getShareUrl($wishlist);
        $customerName  = $this->customerSession->getCustomer()->getName() ?: 'Someone';
        $storeId       = (int) $this->storeManager->getStore()->getId();
        $sent          = 0;

        foreach ($emails as $email) {
            try {
                $transport = $this->transportBuilder
                    ->setTemplateIdentifier('magic_multiwishlist_share')
                    ->setTemplateOptions(['area' => Area::AREA_FRONTEND, 'store' => $storeId])
                    ->setTemplateVars([
                        'wishlist_name' => $wishlist->getWishlistName(),
                        'share_url'     => $shareUrl,
                        'customer_name' => $customerName,
                        'message'       => $message,
                    ])
                    ->setFromByScope('general')
                    ->addTo($email)
                    ->getTransport();
                $transport->sendMessage();
                $sent++;
            } catch (\Exception) {
                // Continue sending to remaining addresses
            }
        }

        if ($sent > 0) {
            $this->messageManager->addSuccessMessage(
                __('Your wishlist has been shared with %1 recipient(s).', $sent)
            );
        } else {
            $this->messageManager->addErrorMessage(
                __('Failed to send share emails. Please check your email configuration.')
            );
        }

        return $this->resultRedirectFactory->create()->setPath(
            'multiwishlist/index/view',
            ['wishlist_id' => $wishlist->getId()]
        );
    }
}
