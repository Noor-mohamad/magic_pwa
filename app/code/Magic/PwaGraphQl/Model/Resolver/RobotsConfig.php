<?php
declare(strict_types=1);

namespace Magic\PwaGraphQl\Model\Resolver;

use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Store\Model\ScopeInterface;

/**
 * Resolves Query.robotsConfig — the same "Search Engine Robots" Admin
 * setting (Content > Design > Configuration) that
 * Magento\Robots\Model\Robots uses to generate robots.txt, exposed
 * over GraphQL for venia-ui's RobotsMeta component (see
 * robotsMeta.gql.js), which requests exactly these two fields.
 */
class RobotsConfig implements ResolverInterface
{
    private const XML_PATH_DEFAULT_ROBOTS = 'design/search_engine_robots/default_robots';
    private const XML_PATH_CUSTOM_INSTRUCTIONS = 'design/search_engine_robots/custom_instructions';

    private ScopeConfigInterface $scopeConfig;

    public function __construct(ScopeConfigInterface $scopeConfig)
    {
        $this->scopeConfig = $scopeConfig;
    }

    /**
     * @return array{defaultRobots: ?string, customInstructions: ?string}
     */
    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        ?array $value = null,
        ?array $args = null
    ): array {
        $store = $context->getExtensionAttributes()->getStore();
        // Matches Magento\Robots\Model\Robots::getData(), which reads
        // custom_instructions at website scope — default_robots lives
        // under the same config.xml section, so it's read the same way.
        $websiteId = $store ? (int) $store->getWebsiteId() : null;

        return [
            'defaultRobots' => $this->scopeConfig->getValue(
                self::XML_PATH_DEFAULT_ROBOTS,
                ScopeInterface::SCOPE_WEBSITE,
                $websiteId
            ),
            'customInstructions' => $this->scopeConfig->getValue(
                self::XML_PATH_CUSTOM_INSTRUCTIONS,
                ScopeInterface::SCOPE_WEBSITE,
                $websiteId
            ),
        ];
    }
}
