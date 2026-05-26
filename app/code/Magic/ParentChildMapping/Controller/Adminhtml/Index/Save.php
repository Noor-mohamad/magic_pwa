<?php
namespace Magic\ParentChildMapping\Controller\Adminhtml\Index;

use Magento\Backend\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;
use Magento\Backend\Model\View\Result\ForwardFactory;
use Magento\Framework\App\Request\DataPersistorInterface;
use Magic\ParentChildMapping\Api\ParentChildRepositoryInterface;
use Magic\ParentChildMapping\Model\ParentChildFactory;
use Magic\ParentChildMapping\Controller\Adminhtml\AbstractController;

class Save extends AbstractController
{
    private ParentChildFactory $modelFactory;
    private DataPersistorInterface $dataPersistor;

    public function __construct(
        Context $context,
        ParentChildRepositoryInterface $repository,
        PageFactory $resultPageFactory,
        ForwardFactory $resultForwardFactory,
        ParentChildFactory $modelFactory,
        DataPersistorInterface $dataPersistor
    ) {
        $this->modelFactory  = $modelFactory;
        $this->dataPersistor = $dataPersistor;
        parent::__construct($context, $repository, $resultPageFactory, $resultForwardFactory);
    }

    public function execute()
    {
        $resultRedirect = $this->resultRedirectFactory->create();
        $data           = $this->getRequest()->getPostValue();

        if (!$data) {
            return $resultRedirect->setPath('*/*/');
        }

        $id = $data['id'] ?? null;

        try {
            $model = $id ? $this->repository->getById($id) : $this->modelFactory->create();
            $model->setData($data);
            if ($id) {
                $model->setId($id);
            }

            $this->repository->save($model);
            $this->messageManager->addSuccessMessage(__('Mapping saved successfully.'));
            $this->dataPersistor->clear('magic_parentchild_record');

            if ($this->getRequest()->getParam('back')) {
                return $resultRedirect->setPath('*/*/edit', ['id' => $model->getId()]);
            }
            return $resultRedirect->setPath('*/*/');
        } catch (\Magento\Framework\Exception\LocalizedException $e) {
            $this->messageManager->addErrorMessage($e->getMessage());
        } catch (\Exception $e) {
            $this->messageManager->addExceptionMessage($e, __('Something went wrong while saving.'));
        }

        $this->dataPersistor->set('magic_parentchild_record', $data);
        return $resultRedirect->setPath('*/*/edit', ['id' => $id]);
    }
}
