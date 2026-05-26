<?php
namespace Magic\ParentChildMapping\Block\Adminhtml\Edit\Buttons;

use Magento\Framework\View\Element\UiComponent\Control\ButtonProviderInterface;

class Delete extends Generic implements ButtonProviderInterface
{
    public function getButtonData()
    {
        if (!$this->getId()) {
            return [];
        }
        return [
            'label'      => __('Delete'),
            'class'      => 'delete',
            'on_click'   => sprintf(
                "deleteConfirm('%s', '%s')",
                __('Are you sure you want to delete this record?'),
                $this->getUrl('*/*/delete', ['id' => $this->getId()])
            ),
            'sort_order' => 20,
        ];
    }
}
