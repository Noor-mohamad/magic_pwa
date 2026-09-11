<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\App\ResponseInterface;

abstract class AbstractAction extends Action
{
    public function __construct(
        Context $context,
        protected readonly CustomerSession $customerSession
    ) {
        parent::__construct($context);
    }

    public function dispatch(RequestInterface $request): ResponseInterface
    {
        if (!$this->customerSession->isLoggedIn()) {
            $this->customerSession->setAfterAuthUrl($this->_url->getCurrentUrl());
            $this->customerSession->authenticate();
            return $this->_response;
        }
        return parent::dispatch($request);
    }

    protected function getCustomerId(): int
    {
        return (int) $this->customerSession->getCustomerId();
    }
}
