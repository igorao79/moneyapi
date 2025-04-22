# Money API

Currency conversion and monitoring application built with React and TypeScript.

## Features

- Monitor currency exchange rates
- Convert between different currencies
- Track rate changes over time
- Add and remove currencies from tracking list
- Responsive design for all devices

## Live Demo

[View the live application](https://igorao79.github.io/moneyapi/)

## Tech Stack

- React 19 with TypeScript
- Vite for fast development and bundling
- SCSS for styling
- React Icons for UI components
- Optimized build with code splitting
- Responsive design for all screen sizes

## Installation

```bash
# Clone the repository
git clone https://github.com/igorao79/moneyapi.git

# Navigate to the project directory
cd moneyapi

# Install dependencies
npm install

# Start development server
npm run dev
```

## Deployment

The project is configured for automatic deployment to GitHub Pages.

```bash
# Build and deploy to GitHub Pages
npm run deploy
```

## Optimizations

This project includes several optimization features:

- Code splitting for efficient loading
- Image optimization with vite-plugin-imagemin
- Gzip compression for smaller bundle sizes
- SWC compiler for faster builds
- TypeScript and ESLint for code quality

## Project Structure

```
/src
  /components       # React components
  /contexts         # Context providers
  /services         # API and other services
  /styles           # SCSS styles
  /types            # TypeScript type definitions
  App.tsx           # Main application component
  main.tsx          # Entry point
```

## License

MIT
