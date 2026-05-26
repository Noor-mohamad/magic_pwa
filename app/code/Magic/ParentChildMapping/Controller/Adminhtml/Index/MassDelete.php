<?php
namespace Magic\ParentChildMapping\Controller\Adminhtml\Index;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Ui\Component\MassAction\Filter;
use Magic\ParentChildMapping\Api\ParentChildRepositoryInterface;
use Magic\ParentChildMapping\Model\ResourceModel\ParentChild\CollectionFactory;

class MassDelete extends Action
{
    const ACTION_RESOURCE = 'Magic_ParentChildMapping::delete';

    private Filter $filter;
    private CollectionFactory $collectionFactory;
    private ParentChildRepositoryInterface $repository;

    public function __construct(
        Context $context,
        Filter $filter,
        CollectionFactory $collectionFactory,
        ParentChildRepositoryInterface $repository
    ) {
        $this->filter            = $filter;
        $this->collectionFactory = $collectionFactory;
        $this->repository        = $repository;
        parent::__construct($context);
    }

    public function execute()
    {
        $resultRedirect = $this->resultRedirectFactory->create();

        try {
            $collection = $this->filter->getCollection($this->collectionFactory->create());
            $count      = $collection->getSize();

            foreach ($collection as $item) {
                $this->repository->delete($item);
            }

            $this->messageManager->addSuccessMessage(__('A total of %1 record(s) have been deleted.', $count));
        } catch (\Exception $e) {
            $this->messageManager->addErrorMessage(__('An error occurred while deleting records.'));
        }

        return $resultRedirect->setPath('magic_parentchild/index/index');
    }

    protected function _isAllowed()
    {
        return $this->_authorization->isAllowed(self::ACTION_RESOURCE);
    }
}
