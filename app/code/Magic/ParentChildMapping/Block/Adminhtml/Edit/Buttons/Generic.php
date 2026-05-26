<?php
namespace Magic\ParentChildMapping\Block\Adminhtml\Edit\Buttons;

use Magento\Backend\Block\Widget\Context;

class Generic
{
    protected Context $context;

    public function __construct(Context $context)
    {
        $this->context = $context;
    }

    public function getId()
    {
        return $this->context->getRequest()->getParam('id');
    }

    public function getUrl($route = '', $params = [])
    {
        return $this->context->getUrlBuilder()->getUrl($route, $params);
    }
}
