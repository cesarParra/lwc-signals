# Contributing to LWC Signals

First off, thank you for considering contributing to LWC Signals. It's your contributions that make
the community a great place to be.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check
our [Issues](https://github.com/cesarParra/lwc-signals/issues) to see if someone else in the community has already created a ticket. If not, go ahead and [make one](https://github.com/cesarParra/lwc-signals/issues/new)!

## Fork & create a branch

If this is something you think you can fix, then [fork LWC Signals](https://help.github.com/articles/fork-a-repo) and
create a branch with a descriptive name.

```bash
git checkout -b new-feature-or-fix
```

## Get the test suite running

Make sure you're using the latest npm and install the necessary dependencies:

```bash
npm install
```

Now, you should be able to run the tests:

```bash
npm test
```

## Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first.

## Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with LWC Signals' main branch:

```bash
git remote add upstream git@github.com:cesarParra/lwc-signals.git
git checkout master
git pull upstream master
```

Then update your feature branch from your local copy of master, and push it!

```bash
git checkout new-feature-or-fix
git rebase master
git push --set-upstream origin new-feature-or-fix
```

Go to the LWC Signals repo and press the "Compare & pull request" button.

## Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed,
and that you need to update your branch so it's easier to merge. To learn more about rebasing in Git,
there are a lot of good resources but here's the suggested workflow:

```bash
git checkout new-feature-or-fix
git pull --rebase upstream master
git push --force-with-lease new-feature-or-fix
```

## Merging a PR (maintainers only)

A PR can only be merged into master by a maintainer if:

- It is passing CI.
- It has been approved by at least two maintainers. If it was a maintainer who opened the PR, only one extra approval is needed.
- It has no requested changes.
- It is up to date with current master.

Any maintainer is allowed to merge a PR if all of these conditions are met.

## Thank you!

Thanks again for your contribution, we truly appreciate it.
