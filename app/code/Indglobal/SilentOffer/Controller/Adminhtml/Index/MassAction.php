<?php

namespace Indglobal\SilentOffer\Controller\Adminhtml\Index;

use Magento\Backend\App\Action\Context;
use Magento\Framework\App\ResourceConnection as ResourceConnection;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Registry;
use Magento\Framework\View\Result\PageFactory;
use Magento\Backend\Model\View\Result\ForwardFactory;
use Magento\Ui\Component\MassAction\Filter;
use Indglobal\SilentOffer\Api\SilentOfferSkuRepositoryInterface;
use Indglobal\SilentOffer\Controller\Adminhtml\AbstractSilentOfferSku;
use Indglobal\SilentOffer\Model\SilentOfferSku as DataModel;
use Indglobal\SilentOffer\Model\ResourceModel\SilentOfferSku\CollectionFactory;

/**
 * Class MassAction
 * @package Indglobal\SilentOffer\Controller\Adminhtml\Index
 */
abstract class MassAction extends AbstractSilentOfferSku
{
    /**
     * @var Filter
     */
    protected $filter;

    /**
     * @var CollectionFactory
     */
    protected $collectionFactory;

    /**
     * @var SilentOfferSkuRepositoryInterface
     */
    protected $dataRepository;

    /**
     * @var ForwardFactory
     */
    protected $resultForwardFactory;

    /**
     * @var string
     */
    protected $successMessage;

    /**
     * @var string
     */
    protected $errorMessage;

    /**
     * MassAction constructor.
     *
     * @param Filter $filter
     * @param Registry $registry
     * @param SilentOfferSkuRepositoryInterface $dataRepository
     * @param PageFactory $resultPageFactory
     * @param Context $context
     * @param ResourceConnection $resourceConnection
     * @param \Magento\Catalog\Model\Product\Action $productAction
     * @param CollectionFactory $collectionFactory
     * @param ForwardFactory $resultForwardFactory
     * @param $successMessage
     * @param $errorMessage
     */
    public function __construct(
        Filter $filter,
        Registry $registry,
        SilentOfferSkuRepositoryInterface $dataRepository,
        PageFactory $resultPageFactory,
        Context $context,
        ResourceConnection $resourceConnection,
        \Magento\Catalog\Model\Product\Action $productAction,
        CollectionFactory $collectionFactory,
        ForwardFactory $resultForwardFactory,
        $successMessage,
        $errorMessage
    ) {
        $this->filter               = $filter;
        $this->dataRepository       = $dataRepository;
        $this->collectionFactory    = $collectionFactory;
        $this->resultForwardFactory = $resultForwardFactory;
        $this->successMessage       = $successMessage;
        $this->errorMessage         = $errorMessage;
        parent::__construct($registry,
            $dataRepository,
            $resultPageFactory,
            $resultForwardFactory,
            $context,
            $resourceConnection,
            $productAction
        );
    }

    /**
     * @param DataModel $data
     * @return mixed
     */
    abstract protected function massAction(DataModel $data);

    /**
     * @return \Magento\Framework\Controller\Result\Redirect
     */
    public function execute()
    {
        try {
            $collection = $this->filter->getCollection($this->collectionFactory->create());
            $collectionSize = $collection->getSize();
            foreach ($collection as $data) {
                $this->massAction($data);
            }
            $this->messageManager->addSuccessMessage(__($this->successMessage, $collectionSize));
        } catch (LocalizedException $e) {
            $this->messageManager->addErrorMessage($e->getMessage());
        } catch (\Exception $e) {
            $this->messageManager->addExceptionMessage($e, __($this->errorMessage));
        }
        $redirectResult = $this->resultRedirectFactory->create();
        $redirectResult->setPath('silentoffer/index/index');
        return $redirectResult;
    }
}
