# AGENTS.md

## Project context
This repository is intended for a calculator application that loads calculation rules and input data from a database-backed data folder rather than hardcoding formulas in the application code.

## Agent guidance
- Treat the database folder as the source of truth for calculation definitions, lookup tables, and validation rules.
- Keep business logic separate from persistence: load rules from the database, then pass them into the calculator engine.
- Prefer small, testable functions for parsing, validation, and calculation.
- Do not introduce hardcoded formulas when a database-driven rule already exists.

## Recommended structure
- `db/` or similar: schema, seeds, migrations, and rule definitions
- `src/` or similar: application logic, calculator engine, and API/CLI entry points
- `tests/` or similar: unit and integration tests for database-backed calculations

## Development expectations
- When changing a calculation rule, update the database definition and any related seed or migration data.
- Validate that incoming data matches the database-defined schema before running calculations.
- Handle missing, invalid, or malformed database records gracefully with clear errors.
- Keep calculation output deterministic and explainable.

## Common pitfalls
- Do not assume the database folder is always available at the same path.
- Do not hardcode rule IDs, constants, or formula strings if they should come from the data layer.
- Do not skip validation for null, empty, or malformed database records.

## Quality bar
- Prefer readable names over clever abstractions.
- Add tests for rule loading, data validation, and calculation behavior.
- Keep documentation concise and point to real project files instead of duplicating details.
