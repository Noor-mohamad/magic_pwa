<?php
namespace Magic\ParentChildMapping\Model;

use Magento\Framework\App\Request\DataPersistorInterface;
use Magento\Ui\DataProvider\AbstractDataProvider;
use Magic\ParentChildMapping\Model\ResourceModel\ParentChild\CollectionFactory;

class ParentChildDataProvider extends AbstractDataProvider
{
    private DataPersistorInterface $dataPersistor;
    private array $loadedData = [];

    public function __construct(
        $name,
        $primaryFieldName,
        $requestFieldName,
        CollectionFactory $collectionFactory,
        DataPersistorInterface $dataPersistor,
        array $meta = [],
        array $data = []
    ) {
        $this->collection    = $collectionFactory->create();
        $this->dataPersistor = $dataPersistor;
        parent::__construct($name, $primaryFieldName, $requestFieldName, $meta, $data);
    }

    public function getData()
    {
        if (!empty($this->loadedData)) {
            return $this->loadedData;
        }

        foreach ($this->collection->getItems() as $item) {
            $this->loadedData[$item->getId()] = $item->getData();
        }

        $persistedData = $this->dataPersistor->get('magic_parentchild_record');
        if (!empty($persistedData)) {
            $item = $this->collection->getNewEmptyItem();
            $item->setData($persistedData);
            $this->loadedData[$item->getId()] = $item->getData();
            $this->dataPersistor->clear('magic_parentchild_record');
        }

        return $this->loadedData;
    }
}
