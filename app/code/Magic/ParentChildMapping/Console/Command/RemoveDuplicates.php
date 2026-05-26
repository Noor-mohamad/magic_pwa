<?php
namespace Magic\ParentChildMapping\Console\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Magento\Framework\App\ResourceConnection;

class RemoveDuplicates extends Command
{
    private ResourceConnection $resource;

    public function __construct(ResourceConnection $resource)
    {
        $this->resource = $resource;
        parent::__construct();
    }

    protected function configure()
    {
        $this->setName('magic:parentchild:remove-duplicates')
             ->setDescription('Remove duplicate (parent_sku, child_sku) rows from childsku_mapping, keeping the lowest ID per pair.');
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $connection = $this->resource->getConnection();
        $table      = $this->resource->getTableName('childsku_mapping');

        $output->writeln('<info>Scanning for duplicates in ' . $table . '...</info>');

        $duplicateCount = (int) $connection->fetchOne("
            SELECT SUM(cnt - 1)
            FROM (
                SELECT COUNT(*) AS cnt
                FROM `{$table}`
                GROUP BY parent_sku, child_sku
                HAVING cnt > 1
            ) t
        ");

        if ($duplicateCount === 0) {
            $output->writeln('<info>No duplicates found. Nothing to do.</info>');
            return Command::SUCCESS;
        }

        $output->writeln("<comment>Found {$duplicateCount} duplicate row(s) to remove.</comment>");

        $deleted = $connection->query("
            DELETE c1 FROM `{$table}` c1
            INNER JOIN `{$table}` c2
                ON c1.parent_sku <=> c2.parent_sku
                AND c1.child_sku <=> c2.child_sku
                AND c1.id > c2.id
        ")->rowCount();

        $output->writeln("<info>Done. {$deleted} duplicate row(s) deleted.</info>");

        return Command::SUCCESS;
    }
}
