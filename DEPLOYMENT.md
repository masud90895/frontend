# Vercel Deployment Guide

This guide explains how to deploy this React SPA application to Vercel.

## Prerequisites

- A Vercel account ([sign up here](https://vercel.com/signup))
- GitHub repository with your code
- Node.js >= 20
- pnpm >= 9.15.4

## Project Configuration

The project is configured for Vercel deployment via `vercel.json`:

- **Build Command**: `pnpm install --frozen-lockfile && pnpm bootstrap && pnpm bundle`
- **Output Directory**: `app/dist`
- **Node Version**: 20.x
- **Framework**: Static (SPA)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Import Project**

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure Project Settings**

   - **Framework Preset**: Other
   - **Root Directory**: `./` (root of repository)
   - **Build Command**: (Already set in `vercel.json`)
   - **Output Directory**: `app/dist` (Already set in `vercel.json`)
   - **Install Command**: `pnpm install --frozen-lockfile` (Already set in `vercel.json`)

3. **Environment Variables**
   Add the following environment variables in Vercel dashboard:

   ```
   NODE_ENV=production
   ```

   Optional environment variables (if needed):

   ```
   PUBLIC_URL=https://your-domain.vercel.app
   MFOX_WORKING_DIR=/app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   vercel
   ```

   For production deployment:

   ```bash
   vercel --prod
   ```

## Build Process

The build process consists of three steps:

1. **Install Dependencies**: `pnpm install --frozen-lockfile`

   - Installs all dependencies using the lockfile for reproducible builds

2. **Bootstrap Workspace**: `pnpm bootstrap`

   - Builds workspace dependencies and prepares the project

3. **Build Application**: `pnpm bundle`
   - Runs the production build which:
     - Executes `metafox bootstrap`
     - Executes `metafox build --production`
     - Outputs to `app/dist/` directory

## Routing Configuration

The application uses client-side routing (React Router). All routes are configured to serve `index.html` to enable proper SPA routing. This is handled automatically by the `rewrites` configuration in `vercel.json`.

## Caching

Static assets are cached with the following headers:

- **Static files** (`/static/*`): 1 year cache with immutable flag
- **Asset files** (`.js`, `.css`, fonts, images): 1 year cache with immutable flag

## Environment Variables

### Required

- `NODE_ENV`: Set to `production` for production builds

### Optional

- `PUBLIC_URL`: Base URL for the application (defaults to `/`)
- `MFOX_WORKING_DIR`: Working directory for build process (defaults to `/app`)

## Troubleshooting

### Build Timeout

If your build times out:

- Vercel free tier has a 45-second timeout for Hobby plans
- Consider upgrading to Pro plan for longer build times
- Optimize build by reducing dependencies or using build cache

### Build Failures

Common issues and solutions:

1. **pnpm not found**

   - Vercel should auto-detect pnpm from `pnpm-lock.yaml`
   - Ensure `packageManager` field in `package.json` is set correctly

2. **Node version mismatch**

   - Ensure Node.js version is >= 20
   - Check `engines.node` in `package.json`

3. **Workspace build issues**

   - Ensure all workspace dependencies are properly configured
   - Check `pnpm-workspace.yaml` exists

4. **Missing output directory**
   - Verify build completes successfully
   - Check `app/dist/` directory exists after build

### Routing Issues

If routes return 404:

- Verify `rewrites` in `vercel.json` are correct
- Ensure all routes point to `/index.html`
- Check browser console for JavaScript errors

## Custom Domain

To add a custom domain:

1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

## Continuous Deployment

Vercel automatically deploys on:

- Push to `main` branch (production)
- Push to other branches (preview deployments)
- Pull requests (preview deployments)

Each deployment gets a unique URL for preview.

## Build Optimization Tips

1. **Enable Build Cache**: Vercel automatically caches `node_modules` between builds
2. **Reduce Bundle Size**: Use code splitting and lazy loading
3. **Optimize Images**: Use Vercel's Image Optimization API
4. **Monitor Build Times**: Check build logs for bottlenecks

## Support

For issues specific to:

- **Vercel**: Check [Vercel Documentation](https://vercel.com/docs)
- **Build Process**: Check build logs in Vercel dashboard
- **Application**: Check application logs and browser console

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [React Router Documentation](https://reactrouter.com/)
