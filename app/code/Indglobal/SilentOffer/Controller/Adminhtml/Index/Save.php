<?php

namespace Indglobal\SilentOffer\Controller\Adminhtml\Index;

use Magento\Catalog\Model\Product\Action;
use Magento\Framework\App\ResourceConnection as ResourceConnection;
use Magento\Framework\Registry;
use Magento\Framework\View\Result\PageFactory;
use Magento\Backend\Model\View\Result\ForwardFactory;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Message\Manager;
use Magento\Framework\Api\DataObjectHelper;
use Indglobal\SilentOffer\Api\SilentOfferSkuRepositoryInterface;
use Indglobal\SilentOffer\Api\Data\SilentOfferSkuInterface;
use Indglobal\SilentOffer\Api\Data\SilentOfferSkuInterfaceFactory;
use Indglobal\SilentOffer\Controller\Adminhtml\AbstractSilentOfferSku;

class Save extends AbstractSilentOfferSku
{
    /**
     * @var Manager
     */
    protected $messageManager;

    /**
     * @var SilentOfferSkuRepositoryInterface
     */
    protected $dataRepository;

    /**
     * @var SilentOfferSkuInterfaceFactory
     */
    protected $dataFactory;

    /**
     * @var DataObjectHelper
     */
    protected $dataObjectHelper;

    /**
     * Save constructor.
     * @param Registry $registry
     * @param SilentOfferSkuRepositoryInterface $dataRepository
     * @param PageFactory $resultPageFactory
     * @param ForwardFactory $resultForwardFactory
     * @param Manager $messageManager
     * @param SilentOfferSkuInterfaceFactory $dataFactory
     * @param DataObjectHelper $dataObjectHelper
     * @param Context $context
     * @param ResourceConnection $resourceConnection
     * @param Action $productAction
     */
    public function __construct(
        Registry $registry,
        SilentOfferSkuRepositoryInterface $dataRepository,
        PageFactory $resultPageFactory,
        ForwardFactory $resultForwardFactory,
        Manager $messageManager,
        SilentOfferSkuInterfaceFactory $dataFactory,
        DataObjectHelper $dataObjectHelper,
        Context $context,
        ResourceConnection $resourceConnection,
        Action $productAction
    ) {
        $this->messageManager   = $messageManager;
        $this->dataFactory      = $dataFactory;
        $this->dataRepository   = $dataRepository;
        $this->dataObjectHelper  = $dataObjectHelper;
        parent::__construct(
            $registry,
            $dataRepository,
            $resultPageFactory,
            $resultForwardFactory,
            $context,
            $resourceConnection,
            $productAction
        );
    }

    /**
     * Save action
     *
     * @return \Magento\Framework\Controller\ResultInterface
     */
    public function execute()
    {
        $data = $this->getRequest()->getPostValue();
        $resultRedirect = $this->resultRedirectFactory->create();
        if ($data) {
            $id = $data["entity_id"] ?? "";
            if (!empty($id)) {
                $model = $this->dataRepository->getById($id);
            } else {
                unset($data['entity_id']);
                $model = $this->dataFactory->create();
            }
            try {
                $this->dataObjectHelper->populateWithArray($model, $data, SilentOfferSkuInterface::class);
                $this->dataRepository->save($model);
                $this->messageManager->addSuccessMessage(__('You saved this data.'));
                $this->_getSession()->setFormData(false);
                if ($this->getRequest()->getParam('back')) {
                    return $resultRedirect->setPath('*/*/edit', ['id' => $model->getId(), '_current' => true]);
                }
                return $resultRedirect->setPath('*/*/');
            } catch (\Magento\Framework\Exception\LocalizedException $e) {
                $this->messageManager->addErrorMessage($e->getMessage());
            } catch (\RuntimeException $e) {
                $this->messageManager->addErrorMessage($e->getMessage());
            } catch (\Exception $e) {
                $this->messageManager->addException($e, __('Something went wrong while saving the data.'));
            }

            $this->_getSession()->setFormData($data);
            return $resultRedirect->setPath('*/*/edit', ['id' => $this->getRequest()->getParam('id')]);
        }
        return $resultRedirect->setPath('*/*/');
    }
}
