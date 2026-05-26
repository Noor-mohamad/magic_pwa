<?php

namespace Indglobal\SilentOffer\Api;

use Magento\Framework\Api\SearchCriteriaInterface;
use Magento\Framework\Exception\CouldNotSaveException;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Exception\StateException;
use Indglobal\SilentOffer\Api\Data\SilentOfferSkuInterface;
use Indglobal\SilentOffer\Model\SilentOfferSku;

/**
 * Interface SilentOfferRepositoryInterface
 * @package Indglobal\SilentOffer\Api
 */
interface SilentOfferSkuRepositoryInterface
{

    /**
     * Save branch address data
     *
     * @param SilentOfferSkuInterface $data
     * @return SilentOfferSku
     */
    public function save(SilentOfferSkuInterface $data);


    /**
     * Get branch address data by id
     *
     * @param int $id
     * @return SilentOfferSku
     */
    public function getById($id);

    /**
     * Get list of branch address data
     *
     * @param SearchCriteriaInterface $searchCriteria
     * @return SilentOfferSkuInterface
     * @throws LocalizedException
     */
    public function getList(SearchCriteriaInterface $searchCriteria);

    /**
     * Delete branch address record
     *
     * @param SilentOfferSkuInterface $data
     * @return mixed
     */
    public function delete(SilentOfferSkuInterface $data);

    /**
     * Delete branch address record id
     *
     * @param int $id
     * @return bool
     * @throws NoSuchEntityException
     * @throws StateException
     * @throws CouldNotSaveException
     */
    public function deleteById($id);
}
