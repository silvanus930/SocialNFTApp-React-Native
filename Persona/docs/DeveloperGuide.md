# Developer Guide

### Branches

Development work should always branch off of the `dev` branch.

#### Naming

```
username/per-###-description-of-ticket
```

Examples:

```

adamjroth/per-282-document-component-development-guide
jasminek/per-39-implement-pinned-posts
will/per-210-toggling-channel-visibility-settings

```

**ProTip**: From Linear, click the _'Copy git branch name to clipboard'_.

#### Maintenance

Please be sure to close branches after merging

---

### Pull Requests

#### Naming

```

PER-###: Descriptive Title of Ticket

```

By following this convention, the Linear issue will automatically be linked.

#### Description & Content

Provide a detailed summary of the work performed in the PR. Including screenshots and/or video clips when applicable is also suggested, and helps the reviewer more quickly understand the context.

---

#### Reviews, Approval & Merging

All PRs must be approved prior to merge by either Adam Roth (@aroth) or Mohammad Sanduka (@msanduka). Use the GitHub Reviewers feature to explicitly add one or both of us so that we receive a notification. If there are other developers with insight into the feature or fix being developed, feel free to add them as well. Don't hesitate to DM us on Persona if a review appears to be lagging. The exception to this rule is any work being done on native components.

Once approved, resolve any pending conflicts and perform a final round of testing.

To maintain a clean history within the `dev` branch, choose the **"Squash and merge"** option. Delete the branch unless there's a pressing reason to keep it around.

---

### Hot Fixes

If possible, make an effort to ticket and PR hot fixes the same as any other development work.

With permission from Raeez, hot fix branches may be merged directly into `dev`. However, a review should still be requested prior to the merge, and performed afterwards. If any follow-up is requested by the reviewer, please create a new ticket and branch for this work and follow the standard pull request process.
