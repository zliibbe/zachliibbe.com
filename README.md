This is a [Next.js](https://nextjs.org/) project (v13) bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

It is deployed on Vercel at [zachliibbe.com](https://www.zachliibbe.com/)

### Automatic Code Linting and Formatting

This project uses [Prettier](https://prettier.io/docs/en/index.html) and [ESLint](https://eslint.org/docs/latest/) in pre-commit hook (using [Husky](https://typicode.github.io/husky/)).

In order for Prettier and ESLint to not conflict, [es-lint-config-prettier](https://github.com/prettier/eslint-config-prettier) is used, leveraging default settings.

This project also implements [lint-staged](https://github.com/okonet/lint-staged) to run linting and formatting against staged files.
