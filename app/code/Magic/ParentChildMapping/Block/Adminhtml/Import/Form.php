<?php
namespace Magic\ParentChildMapping\Block\Adminhtml\Import;

use Magento\Backend\Block\Template;
use Magento\Backend\Block\Template\Context;
use Magento\Framework\Data\Form\FormKey;

class Form extends Template
{
    protected $_template = 'Magic_ParentChildMapping::import/form.phtml';

    protected $formKey;

    public function __construct(
        Context $context,
        FormKey $formKey,
        array $data = []
    ) {
        $this->formKey = $formKey;
        parent::__construct($context, $data);
    }

    public function getUploadUrl(): string
    {
        return $this->getUrl('magic_parentchild/import/upload');
    }

    public function getBackUrl(): string
    {
        return $this->getUrl('magic_parentchild/index/index');
    }

    public function getFormKey(): string
    {
        return $this->formKey->getFormKey();
    }
}
