<?php
namespace Magic\ParentChildMapping\Controller\Adminhtml;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;
use Magento\Backend\Model\View\Result\ForwardFactory;
use Magic\ParentChildMapping\Api\ParentChildRepositoryInterface;

abstract class AbstractController extends Action
{
    const ACTION_RESOURCE = 'Magic_ParentChildMapping::parentchild';

    protected ParentChildRepositoryInterface $repository;
    protected PageFactory $resultPageFactory;
    protected ForwardFactory $resultForwardFactory;

    public function __construct(
        Context $context,
        ParentChildRepositoryInterface $repository,
        PageFactory $resultPageFactory,
        ForwardFactory $resultForwardFactory
    ) {
        $this->repository           = $repository;
        $this->resultPageFactory    = $resultPageFactory;
        $this->resultForwardFactory = $resultForwardFactory;
        parent::__construct($context);
    }

    protected function _isAllowed()
    {
        return $this->_authorization->isAllowed(static::ACTION_RESOURCE);
    }
}
