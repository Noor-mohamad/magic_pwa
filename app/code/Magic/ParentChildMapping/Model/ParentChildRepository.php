<?php
namespace Magic\ParentChildMapping\Model;

use Magic\ParentChildMapping\Api\ParentChildRepositoryInterface;
use Magic\ParentChildMapping\Api\Data\ParentChildInterface;
use Magic\ParentChildMapping\Model\ResourceModel\ParentChild as ResourceModel;
use Magic\ParentChildMapping\Model\ParentChildFactory;
use Magento\Framework\Exception\CouldNotSaveException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Exception\CouldNotDeleteException;

class ParentChildRepository implements ParentChildRepositoryInterface
{
    private ResourceModel $resource;
    private ParentChildFactory $modelFactory;

    public function __construct(
        ResourceModel $resource,
        ParentChildFactory $modelFactory
    ) {
        $this->resource     = $resource;
        $this->modelFactory = $modelFactory;
    }

    public function save(ParentChildInterface $record)
    {
        try {
            $this->resource->save($record);
        } catch (\Exception $e) {
            throw new CouldNotSaveException(__('Could not save record: %1', $e->getMessage()));
        }
        return $record;
    }

    public function getById($id)
    {
        $model = $this->modelFactory->create();
        $this->resource->load($model, $id);
        if (!$model->getId()) {
            throw new NoSuchEntityException(__('Record with ID "%1" does not exist.', $id));
        }
        return $model;
    }

    public function delete(ParentChildInterface $record)
    {
        try {
            $this->resource->delete($record);
        } catch (\Exception $e) {
            throw new CouldNotDeleteException(__('Could not delete record: %1', $e->getMessage()));
        }
        return true;
    }

    public function deleteById($id)
    {
        return $this->delete($this->getById($id));
    }
}
