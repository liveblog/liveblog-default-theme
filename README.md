# Liveblog 3 SEO Theme repo is **DEPRECATED**

Last update to this repository has been done with Liveblog v3.4.0 release.
As of now, any new changes will be only available under our monorepo approach.

We integrated a monorepo approach and the source code is now kept in the liveblog repo
in the `server/liveblog/themes/themes_assets/default`
Link to the `master branch` to the following [path](https://github.com/liveblog/liveblog/tree/master/server/liveblog/themes/themes_assets/default)

A typical workflow for a `theme` only collaborator will change from the current steps

```
git clone https://github.com/liveblog/liveblog-default-theme
cd liveblog-default-theme
npm install
gulp watch-static
```

to the next steps

```
git clone https://github.com/liveblog/liveblog
cd liveblog/server/liveblog/themes/themes_assets/default
npm install
gulp watch-static
```
