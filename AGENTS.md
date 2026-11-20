# AGENTS.md

Instructions for AI coding agents working in this repository. For the stack, commands and project layout see `README.md`. Planned changes are tracked with OpenSpec in `openspec/`.

## Picking up an issue

Work is tracked as GitHub issues on the project board **CCards** (https://github.com/users/tclaes/projects/1, repository `tclaes/ccards`). The board has a `Status` field with the options `Todo`, `In Progress` and `Done`.

**As soon as you pick up an issue (before writing a proposal or any code), move its board item from `Todo` to `In Progress`.** "Picking up" means the user asks you to start, propose, apply or fix an issue (for example "start issue #5"). Do not move an item for issues you only read or discuss.

Run these from any directory in the repo (needs the `gh` token scope `project`). Replace `<N>` with the issue number:

```sh
# 1. Find the board item id of the issue
ITEM_ID=$(gh project item-list 1 --owner tclaes --limit 200 --format json \
  | python3 -c "import json,sys; print(next(i['id'] for i in json.load(sys.stdin)['items'] if i['content'].get('number')==<N> and i['content'].get('repository')=='tclaes/ccards'))")

# 2. Set Status to In Progress
gh project item-edit --id "$ITEM_ID" \
  --project-id PVT_kwHOAMhBNM4BsZHn \
  --field-id PVTSSF_lAHOAMhBNM4BsZHnzhqnexg \
  --single-select-option-id 47fc9ee4
```

Reference ids (re-read them with `gh project field-list 1 --owner tclaes --format json` if a command fails with "not found"):

| What                 | Id                               |
| -------------------- | -------------------------------- |
| Project              | `PVT_kwHOAMhBNM4BsZHn`           |
| `Status` field       | `PVTSSF_lAHOAMhBNM4BsZHnzhqnexg` |
| Option `Todo`        | `f75ad846`                       |
| Option `In Progress` | `47fc9ee4`                       |
| Option `Done`        | `98236657`                       |

Rules:

- Only move items that are currently `Todo`. If the item is already `In Progress` or `Done`, leave it and tell the user.
- If the issue is not on the board, or the command fails (missing `project` scope, no network), do not stop the task: say so in your reply and carry on.
- Verify the move: `gh project item-list 1 --owner tclaes --format json` shows `"status": "In Progress"` for the item.
- Say in your reply that you moved the item.
- Do not move items to `Done` yourself; that happens when the pull request is merged and the issue is closed.
