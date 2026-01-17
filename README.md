# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deployment Instructions

To deploy the `table-visualizer` application, follow these steps:

1. **Build the Project**:
   Run the following command to create a production build of the application:
   ```bash
   npm run build
   ```

2. **Serve the Build**:
   Use a static file server to serve the contents of the `dist` folder. For example, you can use `vite preview` to preview the build locally:
   ```bash
   npm run preview
   ```

3. **Deploy to a Hosting Service**:
   - Upload the contents of the `dist` folder to your hosting service (e.g., Netlify, Vercel, AWS S3, etc.).
   - Ensure that your hosting service is configured to serve the `index.html` file for all routes.

4. **Environment Variables**:
   If your application relies on environment variables, ensure they are properly configured in your hosting service.

5. **Verify Deployment**:
   Visit the deployed URL to ensure the application is working as expected.

### Deploying to Vercel

To deploy the `table-visualizer` application to Vercel, follow these steps:

1. **Login to Vercel**:
   - If you don’t already have a Vercel account, create one at [vercel.com](https://vercel.com/).
   - Install the Vercel CLI by running:
     ```bash
     npm install -g vercel
     ```
   - Login to your Vercel account:
     ```bash
     vercel login
     ```

2. **Initialize the Project**:
   - In the root directory of your project, run:
     ```bash
     vercel
     ```
   - Follow the prompts to configure your project for deployment.

3. **Deploy the Application**:
   - To deploy the application, run:
     ```bash
     vercel --prod
     ```
   - This will create a production deployment and provide you with a live URL.

4. **Environment Variables**:
   - If your application uses environment variables, add them in the Vercel dashboard under the "Environment Variables" section.

5. **Verify Deployment**:
   - Visit the live URL provided by Vercel to ensure the application is working as expected.
