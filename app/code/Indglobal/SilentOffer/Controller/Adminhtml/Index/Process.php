<?php

namespace Indglobal\SilentOffer\Controller\Adminhtml\Index;

use Indglobal\SilentOffer\Controller\Adminhtml\AbstractSilentOfferSku;

class Process extends AbstractSilentOfferSku
{
    /**
     * @return \Magento\Framework\App\ResponseInterface|\Magento\Framework\Controller\ResultInterface|void
     */
    public function execute()
    {
        $id = $this->getRequest()->getParam("id");
        $resultRedirect = $this->resultRedirectFactory->create();
        if ($id) {
            try {
                $model = $this->dataRepository->getById($id);
                $allSku = array_filter(explode(",", $model->getSku()), 'strlen');
                if (!empty($allSku)) {
                    $connection = $this->_resourceConnection->getConnection();
                    $tableName = $connection->getTableName("childsku_mapping");
                    $result = $connection->update(
                        $tableName,
                        [
                            "special_price" => "0.00",
                            "from_date" => null,
                            "to_date" => null,
                            "update_price_flag" => 0
                        ],
                        [
                            "parent_sku IN (?)" => $allSku
                        ]
                    );
                    if ($result > 0) {
                        $this->messageManager->addSuccessMessage(
                            __("Offer is removed for selected brand SKUs")
                        );
                    } else {
                        $this->messageManager->addErrorMessage(
                            __("Something went wrong no pending result found")
                        );
                    }

                    $selectProduct = $connection->select()->from("catalog_product_entity")->where(
                        "sku IN (?)", $allSku
                    );
                    $resultData = $connection->fetchAll($selectProduct);
                    $productIds = [];
                    foreach ($resultData as $productData) {
                        $productIds[] = $productData["entity_id"];
                    }
                    if (!empty($productIds)) {
                        $this->_productAction->updateAttributes(
                            $productIds,
                            [
                                'special_price' => null,
                                'special_from_date' => null,
                                'special_to_date' => null
                            ],
                            0
                        );
                        $this->_productAction->updateAttributes(
                            $productIds,
                            [
                                'special_price' => null,
                                'special_from_date' => null,
                                'special_to_date' => null
                            ],
                            1
                        );
                    }
                } else {
                    $this->messageManager->addErrorMessage(
                        __("Something went wrong SKUs are not found.")
                    );
                }
            } catch (\Magento\Framework\Exception\LocalizedException $e) {
                $this->messageManager->addErrorMessage($e->getMessage());
            } catch (\RuntimeException $e) {
                $this->messageManager->addErrorMessage($e->getMessage());
            } catch (\Exception $e) {
                $this->messageManager->addErrorMessage($e, __('Something went wrong while saving the data.'));
            }
        }
        $resultRedirect->setPath('silentoffer/index/index');
        return $resultRedirect;
    }
}
