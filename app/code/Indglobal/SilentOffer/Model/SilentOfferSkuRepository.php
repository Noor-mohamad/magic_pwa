<?php

namespace Indglobal\SilentOffer\Model;

use Magento\Framework\Api\DataObjectHelper;
use Magento\Framework\Api\SearchCriteriaInterface;
use Magento\Framework\Api\Search\FilterGroup;
use Magento\Framework\Api\SortOrder;
use Magento\Framework\Exception\CouldNotSaveException;
use Magento\Framework\Exception\StateException;
use Magento\Framework\Exception\ValidatorException;
use Magento\Framework\Exception\NoSuchEntityException;
use Indglobal\SilentOffer\Api\SilentOfferSkuRepositoryInterface;
use Indglobal\SilentOffer\Api\Data\SilentOfferSkuInterface;
use Indglobal\SilentOffer\Api\Data\SilentOfferSkuInterfaceFactory;
use Indglobal\SilentOffer\Api\Data\SilentOfferSkuSearchResultsInterfaceFactory;
use Indglobal\SilentOffer\Api\Data\SilentOfferSkuSearchResultsInterface;
use Indglobal\SilentOffer\Model\ResourceModel\SilentOfferSku as ResourceData;
use Indglobal\SilentOffer\Model\ResourceModel\SilentOfferSku\CollectionFactory as DataCollectionFactory;

/**
 * Class SilentOfferSkuRepository
 * @package Indglobal\SilentOffer\Model
 */
class SilentOfferSkuRepository implements SilentOfferSkuRepositoryInterface
{
    /**
     * @var array
     */
    protected $instances = [];

    /**
     * @var ResourceData
     */
    protected $resource;

    /**
     * @var DataCollectionFactory
     */
    protected $dataCollectionFactory;

    /**
     * @var SilentOfferSkuSearchResultsInterfaceFactory
     */
    protected $searchResultsFactory;

    /**
     * @var SilentOfferSkuInterfaceFactory
     */
    protected $dataInterfaceFactory;

    /**
     * @var DataObjectHelper
     */
    protected $dataObjectHelper;

    public function __construct(
        ResourceData $resource,
        DataCollectionFactory $dataCollectionFactory,
        SilentOfferSkuSearchResultsInterfaceFactory $dataSearchResultsInterfaceFactory,
        SilentOfferSkuInterfaceFactory $dataInterfaceFactory,
        DataObjectHelper $dataObjectHelper
    ) {
        $this->resource = $resource;
        $this->dataCollectionFactory = $dataCollectionFactory;
        $this->searchResultsFactory = $dataSearchResultsInterfaceFactory;
        $this->dataInterfaceFactory = $dataInterfaceFactory;
        $this->dataObjectHelper = $dataObjectHelper;
    }

    /**
     * Save branch address data
     *
     * @param SilentOfferSkuInterface $data
     * @return SilentOfferSkuInterface
     * @throws CouldNotSaveException
     */
    public function save(SilentOfferSkuInterface $data)
    {
        try {
            /** @var SilentOfferSkuInterface|\Magento\Framework\Model\AbstractModel $data */
            $this->resource->save($data);
        } catch (\Exception $exception) {
            throw new CouldNotSaveException(__(
                'Could not save the data: %1',
                $exception->getMessage()
            ));
        }
        return $data;
    }

    /**
     * Get branch address data by id
     *
     * @param int $id
     * @return SilentOfferSku
     * @throws NoSuchEntityException
     */
    public function getById($id)
    {
        if (!isset($this->instances[$id])) {
            /** @var SilentOfferSkuInterface|\Magento\Framework\Model\AbstractModel $data */
            $data = $this->dataInterfaceFactory->create();
            $this->resource->load($data, $id);
            if (!$data->getId()) {
                throw new NoSuchEntityException(__('Requested data doesn\'t exist'));
            }
            $this->instances[$id] = $data;
        }
        return $this->instances[$id];
    }

    /**
     * Get list of branch address data
     *
     * @param SearchCriteriaInterface $searchCriteria
     * @return SilentOfferSkuSearchResultsInterface
     */
    public function getList(SearchCriteriaInterface $searchCriteria)
    {
        /** @var SilentOfferSkuSearchResultsInterface $searchResults */
        $searchResults = $this->searchResultsFactory->create();
        $searchResults->setSearchCriteria($searchCriteria);

        /** @var \Indglobal\SilentOffer\Model\ResourceModel\SilentOfferSku\Collection $collection */
        $collection = $this->dataCollectionFactory->create();

        //Add filters from root filter group to the collection
        /** @var FilterGroup $group */
        foreach ($searchCriteria->getFilterGroups() as $group) {
            $this->addFilterGroupToCollection($group, $collection);
        }
        $sortOrders = $searchCriteria->getSortOrders();
        /** @var SortOrder $sortOrder */
        if ($sortOrders) {
            foreach ($searchCriteria->getSortOrders() as $sortOrder) {
                $field = $sortOrder->getField();
                $collection->addOrder(
                    $field,
                    ($sortOrder->getDirection() == SortOrder::SORT_ASC) ? 'ASC' : 'DESC'
                );
            }
        } else {
            $collection->addOrder(SilentOfferSkuInterface::ENTITY_ID, 'ASC');
        }
        $collection->setCurPage($searchCriteria->getCurrentPage());
        $collection->setPageSize($searchCriteria->getPageSize());

        $data = [];
        foreach ($collection as $datum) {
            $dataDataObject = $this->dataInterfaceFactory->create();
            $this->dataObjectHelper->populateWithArray($dataDataObject, $datum->getData(), SilentOfferSkuInterface::class);
            $data[] = $dataDataObject;
        }
        $searchResults->setTotalCount($collection->getSize());
        return $searchResults->setItems($data);
    }

    /**
     * Delete branch address record
     *
     * @param SilentOfferSkuInterface $data
     * @return bool
     * @throws CouldNotSaveException
     * @throws StateException
     */
    public function delete(SilentOfferSkuInterface $data)
    {
        /** @var SilentOfferSkuInterface|\Magento\Framework\Model\AbstractModel $data */
        $id = $data->getId();
        try {
            unset($this->instances[$id]);
            $this->resource->delete($data);
        } catch (ValidatorException $e) {
            throw new CouldNotSaveException(__($e->getMessage()));
        } catch (\Exception $e) {
            throw new StateException(
                __('Unable to remove data %1', $id)
            );
        }
        unset($this->instances[$id]);
        return true;
    }

    /**
     * Delete branch address record id
     *
     * @param int $id
     * @return bool
     * @throws NoSuchEntityException
     * @throws StateException
     * @throws CouldNotSaveException
     */
    public function deleteById($id)
    {
        $data = $this->getById($id);
        try {
            return $this->delete($data);
        } catch (CouldNotSaveException $e) {
            throw new CouldNotSaveException(__($e->getMessage()));
        } catch (StateException $e) {
            throw new StateException(
                __('Unable to remove data %1', $id)
            );
        }
    }
}
