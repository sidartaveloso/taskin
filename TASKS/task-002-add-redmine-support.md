# Task 002 — Add Redmine Task Provider Support

Status: in-progress
Type: feat
Assignee: Sidarta Veloso

## Description

Implement a Redmine task provider to allow Taskin to interact with Redmine issues via API. This will enable users to manage Redmine issues directly from the CLI.

## Requirements

### Core Features

- [ ] Create `RedmineTaskProvider` class implementing `ITaskProvider`
- [ ] Implement Redmine API client with authentication
- [ ] Map Redmine issues to Taskin tasks
- [ ] Support CRUD operations (create, read, update, delete)
- [ ] Handle Redmine-specific fields (priority, tracker, category, etc.)

### Configuration

- [ ] Add Redmine configuration to `.taskin.json`
  - API URL
  - API key / authentication
  - Project ID
  - Custom field mappings
- [ ] Update `init` command to support Redmine provider selection
- [ ] Add interactive prompts for Redmine configuration

### API Integration

- [ ] GET `/issues.json` - List issues
- [ ] GET `/issues/:id.json` - Get specific issue
- [ ] PUT `/issues/:id.json` - Update issue
- [ ] POST `/issues.json` - Create issue
- [ ] Support pagination for large result sets
- [ ] Handle rate limiting and errors gracefully

### Mapping

Map Redmine fields to Taskin:

- Issue ID → Task ID
- Subject → Task title
- Description → Task content
- Status → Task status (pending, in-progress, done, blocked)
- Tracker → Task type (feat, fix, chore, etc.)
- Assigned to → Task assignee

### Testing

- [ ] Unit tests for RedmineTaskProvider
- [ ] Integration tests with mock Redmine API
- [ ] Test error handling and edge cases
- [ ] Test authentication and authorization

## Technical Details

### Package Structure

```
packages/
  redmine-task-provider/
    src/
      redmine-task-provider.ts
      redmine-task-provider.types.ts
      redmine-task-provider.test.ts
      redmine-api-client.ts
      redmine-api-client.types.ts
      index.ts
    package.json
    tsconfig.json
```

### Configuration Example

```json
{
  "provider": {
    "config": {
      "apiKey": "your-api-key",
      "apiUrl": "https://redmine.example.com",
      "fieldMappings": {
        "status": {
          "Blocked": "blocked",
          "In Progress": "in-progress",
          "New": "pending",
          "Resolved": "done"
        },
        "tracker": {
          "Bug": "fix",
          "Feature": "feat",
          "Support": "chore"
        }
      },
      "projectId": "my-project"
    },
    "type": "redmine"
  },
  "version": "1.0.3"
}
```

### Dependencies

- `axios` or `node-fetch` for HTTP requests
- `@taskin/task-manager` for ITaskProvider interface
- `@taskin/types-ts` for types

## Acceptance Criteria

- ✅ User can select Redmine as provider during `taskin init`
- ✅ User can configure Redmine credentials interactively
- ✅ `taskin list` fetches and displays Redmine issues
- ✅ `taskin start <id>` updates Redmine issue status
- ✅ `taskin finish <id>` marks Redmine issue as resolved
- ✅ All Redmine API errors are handled gracefully
- ✅ Tests cover >80% of the code

## References

- [Redmine REST API Documentation](https://www.redmine.org/projects/redmine/wiki/Rest_api)
- [Redmine Issues API](https://www.redmine.org/projects/redmine/wiki/Rest_Issues)
- Existing `FileSystemTaskProvider` implementation

## Notes

- Consider implementing a cache to reduce API calls
- Add retry logic for transient network failures
- Support custom field mappings for different Redmine installations
- Future: Support multiple Redmine projects in one workspace
