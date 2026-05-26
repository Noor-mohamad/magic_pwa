<?php

namespace Indglobal\SilentOffer\Controller\Adminhtml;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Registry;
use Magento\Framework\View\Result\PageFactory;
use Magento\Backend\Model\View\Result\ForwardFactory;
use Indglobal\SilentOffer\Api\SilentOfferSkuRepositoryInterface;
use Magento\Framework\App\ResourceConnection as ResourceConnection;

/**
 * Class AbstractSilentOfferSku
 * @package Indglobal\SilentOffer\Controller\Adminhtml
 */
abstract class AbstractSilentOfferSku extends Action
{
    /**
     * Authorization level of a basic admin session
     *
     * @see _isAllowed()
     */
    const ACTION_RESOURCE = 'Indglobal_SilentOffer::silentoffer';

    /**
     * Data repository
     *
     * @var SilentOfferSkuRepositoryInterface
     */
    protected $dataRepository;

    /**
     * Core registry
     *
     * @var Registry
     */
    protected $coreRegistry;

    /**
     * Result Page Factory
     *
     * @var PageFactory
     */
    protected $resultPageFactory;

    /**
     * Result Forward Factory
     *
     * @var ForwardFactory
     */
    protected $resultForwardFactory;

    /**
     * @var ResourceConnection
     */
    protected $_resourceConnection;

    /**
     * @var \Magento\Catalog\Model\Product\Action
     */
    protected $_productAction;

    /**
     * Data constructor.
     *
     * @param Registry $registry
     * @param SilentOfferSkuRepositoryInterface $dataRepository
     * @param PageFactory $resultPageFactory
     * @param ForwardFactory $resultForwardFactory
     * @param Context $context
     * @param ResourceConnection $resourceConnection
     * @param \Magento\Catalog\Model\Product\Action $productAction
     */
    public function __construct(
        Registry $registry,
        SilentOfferSkuRepositoryInterface $dataRepository,
        PageFactory $resultPageFactory,
        ForwardFactory $resultForwardFactory,
        Context $context,
        ResourceConnection $resourceConnection,
        \Magento\Catalog\Model\Product\Action $productAction
    )
    {
        $this->coreRegistry = $registry;
        $this->dataRepository = $dataRepository;
        $this->resultPageFactory = $resultPageFactory;
        $this->resultForwardFactory = $resultForwardFactory;
        $this->_resourceConnection = $resourceConnection;
        $this->_productAction = $productAction;
        parent::__construct($context);
    }
}
