/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
    branches: [
        "main"
    ],
    plugins: [
        [
            "@semantic-release/commit-analyzer",
            {
                preset: "angular",
                releaseRules: [
                    { type: "feat", release: "minor" },
                    { type: "refactor", scope: "major-change", release: "minor" },
                    { type: "fix", release: "patch" },
                    { type: "perf", release: "patch" },
                    { type: "refactor", release: "patch" },
                    { type: "style", release: "patch" },
                    { type: "revert", release: "patch" },
                    { type: "release", release: "major" },
                    { breaking: true, release: "major" },
                    { type: "build", release: false },
                    { type: "chore", release: false },
                    { type: "ci", release: false },
                    { type: "docs", release: false },
                    { scope: "no-release", release: false },
                    { type: "test", release: false }
                ]
            }
        ],
        [
            "@semantic-release/release-notes-generator",
            {
                preset: "conventionalcommits",
                presetConfig: {
                    types: [
                        { type: "feat", section: "✨ Features", hidden: false },
                        { type: "fix", section: "🐞 Bug Fixes", hidden: false },
                        { type: "docs", section: "📚 Documentation Updates", hidden: false },
                        { type: "style", section: "🎨 Style Changes", hidden: false },
                        { type: "refactor", section: "🔨 Code Refactoring", hidden: false },
                        { type: "chore", section: "🛠️ Chores", hidden: false },
                        { type: "perf", section: "⚡ Performance Improvements", hidden: false },
                        { type: "test", section: "✅ Tests", hidden: true },
                        { type: "build", section: "🏗️ Build Changes", hidden: true },
                        { type: "ci", section: "🤖 Continuous Integration", hidden: false },
                        { type: "revert", section: "⏪ Reverts", hidden: false }
                    ]
                },
                parserOpts: {
                    noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"]
                },
                writerOpts: {
                    headerPartial: "### 🚀 Release Notes\n\n**Version**: {{version}}\n**Date**: {{date}}\n"
                }
            }
        ],
        [
            "@semantic-release/changelog",
            {
                changelogFile: "CHANGELOG.md"
            }
        ],
        [
            "@semantic-release/npm",
            {
                npmPublish: false
            }
        ],
        [
            "@semantic-release/exec",
            {
                prepareCmd: "node scripts/update-badge.js ${nextRelease.version}"
            }
        ],
        [
            "@semantic-release/git",
            {
                assets: [
                    "sfdx-project.json",
                    "README.md",
                    "CHANGELOG.md",
                    "package.json",
                    "package-lock.json"
                ],
                message: "chore(release): Version ${nextRelease.version} - Automated release [skip ci]\n\nSee the release details: ${nextRelease.gitTag}"
            }
        ],
        "@semantic-release/github"
    ]
};
