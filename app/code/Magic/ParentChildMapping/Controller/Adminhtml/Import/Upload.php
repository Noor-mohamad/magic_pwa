<?php
namespace Magic\ParentChildMapping\Controller\Adminhtml\Import;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\File\Csv;

class Upload extends Action
{
    const ACTION_RESOURCE    = 'Magic_ParentChildMapping::save';
    private const REQUIRED   = ['parent_sku', 'child_sku'];

    private ResourceConnection $resource;
    private Csv $csvProcessor;

    public function __construct(
        Context $context,
        ResourceConnection $resource,
        Csv $csvProcessor
    ) {
        $this->resource      = $resource;
        $this->csvProcessor  = $csvProcessor;
        parent::__construct($context);
    }

    public function execute()
    {
        $resultRedirect = $this->resultRedirectFactory->create();

        $file = $this->getRequest()->getFiles('import_file');

        if (empty($file) || $file['error'] !== UPLOAD_ERR_OK) {
            $this->messageManager->addErrorMessage(__('Please upload a valid CSV file.'));
            return $resultRedirect->setPath('*/*/index');
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($ext !== 'csv') {
            $this->messageManager->addErrorMessage(__('Only CSV files are allowed.'));
            return $resultRedirect->setPath('*/*/index');
        }

        try {
            $data = $this->csvProcessor->getData($file['tmp_name']);
        } catch (\Exception $e) {
            $this->messageManager->addErrorMessage(__('Could not read CSV: %1', $e->getMessage()));
            return $resultRedirect->setPath('*/*/index');
        }

        if (empty($data)) {
            $this->messageManager->addErrorMessage(__('The CSV file is empty.'));
            return $resultRedirect->setPath('*/*/index');
        }

        // Validate headers
        $headers = array_map('trim', array_map('strtolower', $data[0]));
        foreach (self::REQUIRED as $col) {
            if (!in_array($col, $headers)) {
                $this->messageManager->addErrorMessage(
                    __('Missing required column "%1". Found: %2', $col, implode(', ', $headers))
                );
                return $resultRedirect->setPath('*/*/index');
            }
        }

        $parentIdx = array_search('parent_sku', $headers);
        $childIdx  = array_search('child_sku', $headers);

        $connection = $this->resource->getConnection();
        $table      = $this->resource->getTableName('childsku_mapping');

        $inserted = 0;
        $skipped  = 0;
        $failed   = 0;

        $rows = array_slice($data, 1); // skip header row
        foreach ($rows as $lineNum => $row) {
            $parentSku = trim($row[$parentIdx] ?? '');
            $childSku  = trim($row[$childIdx] ?? '');

            if ($parentSku === '' || $childSku === '') {
                $skipped++;
                continue;
            }

            $exists = $connection->fetchOne(
                "SELECT id FROM `{$table}` WHERE parent_sku = ? AND child_sku = ? LIMIT 1",
                [$parentSku, $childSku]
            );

            if ($exists) {
                $skipped++;
                continue;
            }

            try {
                $connection->insert($table, [
                    'parent_sku' => $parentSku,
                    'child_sku'  => $childSku,
                ]);
                $inserted++;
            } catch (\Exception $e) {
                $failed++;
            }
        }

        if ($inserted > 0) {
            $this->messageManager->addSuccessMessage(__('%1 mapping(s) imported successfully.', $inserted));
        }
        if ($skipped > 0) {
            $this->messageManager->addNoticeMessage(__('%1 row(s) skipped (already exist or empty).', $skipped));
        }
        if ($failed > 0) {
            $this->messageManager->addErrorMessage(__('%1 row(s) failed to import.', $failed));
        }

        return $resultRedirect->setPath('magic_parentchild/index/index');
    }

    protected function _isAllowed()
    {
        return $this->_authorization->isAllowed(self::ACTION_RESOURCE);
    }
}
