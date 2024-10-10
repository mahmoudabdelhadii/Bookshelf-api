[![Build](https://github.com/edwinhern/express-typescript-2024/actions/workflows/build.yml/badge.svg)](https://github.com/edwinhern/express-typescript-2024/actions/workflows/build.yml)
[![Test](https://github.com/edwinhern/express-typescript-2024/actions/workflows/test.yml/badge.svg)](https://github.com/edwinhern/express-typescript-2024/actions/workflows/test.yml)
[![Code Quality](https://github.com/edwinhern/express-typescript-2024/actions/workflows/code-quality.yml/badge.svg)](https://github.com/edwinhern/express-typescript-2024/actions/workflows/code-quality.yml)
[![Docker Image CI](https://github.com/edwinhern/express-typescript-2024/actions/workflows/docker-image.yml/badge.svg)](https://github.com/edwinhern/express-typescript-2024/actions/workflows/docker-image.yml)

#### Step 1: 🚀 Initial Setup

- Install dependencies: `npm ci`

#### Step 2: ⚙️ Environment Configuration

- Create `.env`: Copy `.env.template` to `.env`
- Update `.env`: Fill in necessary environment variables

#### Step 3: 🏃‍♂️ Running the Project

- Development Mode: `npm run dev`
- Building: `npm run build`
- Production Mode: Set `.env` to `NODE_ENV="production"` then `npm run build && npm run start`
