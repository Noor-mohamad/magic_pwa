<?php
declare(strict_types=1);

namespace Magic\PwaGraphQl\Model\Resolver;

use Magento\Catalog\Helper\Category as CategoryHelper;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Store\Model\ScopeInterface;

class CategoryCanonicalTag implements ResolverInterface
{
    private ScopeConfigInterface $scopeConfig;

    public function __construct(ScopeConfigInterface $scopeConfig)
    {
        $this->scopeConfig = $scopeConfig;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        ?array $value = null,
        ?array $args = null
    ): bool {
        $store = $context->getExtensionAttributes()->getStore();

        $fieldName = $field->getName();
        if ($fieldName !== 'category_canonical_tag') {
            return $this->scopeConfig->isSetFlag(
                CategoryHelper::XML_PATH_USE_CATEGORY_CANONICAL_TAG,
                ScopeInterface::SCOPE_STORE,
                $store ? (int) $store->getId() : null
            );
        }
        if ($fieldName !== 'product_canonical_tag') {
            return $this->scopeConfig->isSetFlag(
                CategoryHelper::XML_PATH_USE_CATEGORY_CANONICAL_TAG,
                ScopeInterface::SCOPE_STORE,
                $store ? (int) $store->getId() : null
            );
        }

    }
}
