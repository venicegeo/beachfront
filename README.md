# bf-ui

User interface for the Beachfront project.

## Installing and Developing

```
$ npm install
$ npm run typings:install
$ npm run create-ssl-certs
$ npm run watch
```

> __Note:__ You may need to add `.development_ssl_certificate.pem` to your development machine's SSL trust chain to avoid problems with CORS being blocked by browser SSL security errors.

Open browser to `http://localhost:8080`.  Changes will automatically
reload the browser.


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
