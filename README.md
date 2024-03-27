# TODO
- [X] open issue
    - [X] write markdown post in body
    - [ ] add tags
    - [X] convert to html?

files as tempaltes https://stackoverflow.com/questions/12014547/how-do-i-precompile-partials-for-handlebars-js

- [X] issue -> new file in folder
- [X] folder-based routing
- [ ] lock out non-posting users?
- [ ] private?
- [X] json -> slug.html -> templating engine and releasing?
- [ ] closed issues get published
- [ ] open issues are in "draft" and don’t get published
- [X] need to create a blog template
- [ ] don’t mention issues in the syncing, creates clutter on the issue thread
- [ ] open issues are "drafts" closed issues are publishable
- [ ] add reactions to the post, fork utterances?
- [ ] eventually figure out how to fork
- [X] use ncc to bundle deps?
- [ ] limit whos posts
- [ ] if only the issues path changed… then just rebuild that issue
- [X] if the templates changed… then rebuild all
- [X] gotta recompile ncc every time
- [X] https://github.com/orgs/community/discussions/25702 assholery
    - [X] github actions token doesn’t kick off other workflows
- [X] stop concurrent runs for issues
    - [X] https://docs.github.com/en/actions/using-jobs/using-concurrency
- [X] only commit on diff otherwise annoying failures
- [ ] interesitng syncing app
    - [ ] https://github.com/apps/settings
- [ ] svelte static site generator?
    - [ ] https://kit.svelte.dev/docs/adapter-static
    - [ ] might make it overly opinionated
- [ ] generate page manifest
- [ ] generate rss
- [ ] tissue isn’t a bad tool name lol
- [ ] redirects from old slugs?
    - [ ] redirects from id to slug?
- [ ] $GITHUB_STEP_SUMMARY
- [ ] fork utterances?
    - [ ] ability to react to the post itself, ability to subscribe to the discussion on github
- [X] file name templating/iterating
- [X] need the ability for some JSON files as static data
    - [X] eg a list of projects
- interesting https://github.com/marketplace/actions/deploy-pr-preview



ok so the big todo:
- issue management
  - create a whitelisting/auth system
- figure out how to template files into each other as partials
- figure out how to support external configs, both of static json and custom helpers for extensions