<?php
namespace Magic\ParentChildMapping\Controller\Adminhtml\Index;

use Magic\ParentChildMapping\Controller\Adminhtml\AbstractController;

class Delete extends AbstractController
{
    public function execute()
    {
        $resultRedirect = $this->resultRedirectFactory->create();
        $id             = $this->getRequest()->getParam('id');

        if (!$id) {
            $this->messageManager->addErrorMessage(__('No record ID provided.'));
            return $resultRedirect->setPath('*/*/');
        }

        try {
            $this->repository->deleteById($id);
            $this->messageManager->addSuccessMessage(__('Mapping deleted successfully.'));
        } catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
            $this->messageManager->addErrorMessage(__('Record no longer exists.'));
        } catch (\Exception $e) {
            $this->messageManager->addErrorMessage(__('Could not delete the record.'));
        }

        return $resultRedirect->setPath('*/*/');
    }
}
