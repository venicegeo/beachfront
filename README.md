# bf-ui

The BF-UI is a user interface for the Beachfront project. BF-UI is a single-page web application UI providing a human-friendly method of interacting with the Beachfront API.

***
## Requirements
Before building and/or running the pz-search-query service, please ensure that the following components are available and/or installed, as necessary:
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [npm Linux CLI](https://docs.npmjs.com/cli/install)

### Setup
Create the directory the repository must live in, and clone the git repository:

    $ git clone git@github.com:venicegeo/bf-ui.git

## Installing and Developing

If bf-api isn't running locally (it usually isn't because it requires backing
services and other dependencies to also be running) then you'll need to set
the API_ROOT environment variable to be the url pointing to an instance of bf-api

```
$ export API_ROOT = {BF-API_URL}
```
> __Note:__ In the above command, replace {BF-API_URL} with the url pointing to an instance of bf-api.

```
$ npm install
$ npm run create-ssl-certs
$ npm run watch
```

> __Note:__ You may need to add `.development_ssl_certificate.pem` to your development machine's SSL trust chain to avoid problems with CORS being blocked by browser SSL security errors.

Open browser to `https://localhost:8080`. Changes will automatically reload the browser.


## Building

```
npm run build
```

### Environment Variables

| Variable                           | Description                                           |
|------------------------------------|-------------------------------------------------------|
| `API_ROOT`                         | A URL pointing at a [`bf-api`](https://github.com/venicegeo/bf-api) instance. |
| `CLASSIFICATION_BANNER_BACKGROUND` | A color value (e.g., `red`, `green`, `blue`) for the classification banner background. |
| `CLASSIFICATION_BANNER_FOREGROUND` | A color value (e.g., `red`, `green`, `blue`) for the classification banner foreground. |
| `CLASSIFICATION_BANNER_TEXT`       | A text value for the classification banner. |
| `CONSENT_BANNER_TEXT`              | A text value for the consent message shown at the login prompt. |
| `USER_GUIDE_URL`                   | A URL pointing to the Beachfront user guide.  The menu guide icon will only display if this is set. |

## Testing

```
$ npm run lint
$ npm run test
$ npm run test:ci  # Will also generate coverage reports
```
