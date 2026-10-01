ALTER TABLE `research_runs` ADD `top_opportunity` text;
--> statement-breakpoint
ALTER TABLE `research_runs` ADD `top_confidence` text;
--> statement-breakpoint
ALTER TABLE `research_runs` ADD `top_strength` real;
--> statement-breakpoint
UPDATE `research_runs`
SET
  `top_opportunity` = json_extract(`result`, '$.opportunities[0].name'),
  `top_confidence` = json_extract(`result`, '$.opportunities[0].confidence'),
  `top_strength` = CASE
    WHEN json_type(`result`, '$.opportunities[0].strength') IN ('integer', 'real')
      THEN json_extract(`result`, '$.opportunities[0].strength')
    ELSE NULL
  END;
