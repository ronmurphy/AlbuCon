# AlbuCon ✨

A social network focused on sharing positive vibes, gratitude, and joy! Built with modern web technologies and hosted entirely on free infrastructure.

![AlbuCon Banner](https://via.placeholder.com/800x200/FF6B6B/FFFFFF?text=AlbuCon+-+Share+Positive+Vibes)

## 🌟 Features

- 📝 **Post positive thoughts** - Share what makes you smile
- ❤️ **Like posts** - Show appreciation for others' positivity
- 👤 **User profiles** - Track your posts and likes
- 🔐 **Secure authentication** - Email-based sign up and login
- 📱 **Responsive design** - Works beautifully on all devices
- 🎨 **Cheerful UI** - Bright colors and smooth animations

## 🚀 Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool (super fast!)
- **React Router** - Client-side routing
- **CSS3** - Custom styling with CSS variables

### Backend
- **Supabase** - PostgreSQL database, authentication, and APIs
- **Row Level Security** - Built-in security at the database level

### Hosting
- **GitHub Pages** - Free static site hosting
- **Automatic deployments** - Deploy with one command

## 💰 Cost

**$0/month** - Everything runs on free tiers!

- GitHub Pages: Free for public repositories
- Supabase: Free tier includes 500MB database and 50k monthly users

## 🎯 Quick Start

### Prerequisites

- Node.js 16+ installed
- A GitHub account
- A Supabase account (free)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/AlbuCon.git
   cd AlbuCon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Follow the detailed instructions in [SETUP.md](./SETUP.md)
   - Create a Supabase project
   - Run the SQL schema
   - Get your API keys

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Run locally**
   ```bash
   npm run dev
   ```

6. **Deploy**
   ```bash
   npm run deploy
   ```

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## 📁 Project Structure

```
AlbuCon/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── PostCard.jsx
│   │   └── CreatePost.jsx
│   ├── pages/            # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── Profile.jsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.jsx
│   ├── lib/              # Utilities
│   │   └── supabase.js
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── database-schema.sql   # Supabase database setup
├── SETUP.md             # Detailed setup guide
└── package.json         # Dependencies and scripts
```

## 🎨 Customization

### Colors

Edit the CSS variables in `src/index.css`:

```css
:root {
  --primary: #FF6B6B;      /* Main brand color */
  --secondary: #4ECDC4;    /* Secondary brand color */
  --accent: #FFE66D;       /* Accent color */
  /* ... more colors ... */
}
```

### Features to Add

Some ideas for extending the app:
- Comments on posts
- Image uploads
- User-to-user messaging
- Follow/unfollow system
- Hashtags
- Search functionality
- Dark mode
- Notifications

## 🛡️ Security

- Authentication handled by Supabase
- Row Level Security (RLS) policies enforce data access
- Environment variables keep API keys safe
- No secrets exposed in frontend code

## 📊 Database Schema

The app uses three main tables:

1. **profiles** - User profile information
2. **posts** - User posts with content
3. **likes** - Tracks which users liked which posts

See `database-schema.sql` for the complete schema with RLS policies.

## 🤝 Contributing

This is a learning project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Supabase](https://supabase.com)
- Deployed on [GitHub Pages](https://pages.github.com/)
- Icons from emoji (❤️, ✨, etc.)

## 📞 Support

Having issues? Check out:
- [SETUP.md](./SETUP.md) for detailed setup instructions
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)

---

Made with ❤️ and ☕ | [Live Demo](#) | [Report Bug](#) | [Request Feature](#)
