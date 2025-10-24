import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

const ENABLE_VERIFIED_BY_EMAIL = false;

const getUser = async (field: string, value: any) => {
  try {
    const r = await supabase.from('users').select().eq(field, value);
    if (r.data && r.data.length === 1) {
      return r.data[0];
    }
  
    return null;
  } catch (err) {
    console.log(err);
    throw 'error connecting to db';
  }
}
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    /*GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),*/
    Credentials({
      credentials: {
        username: { label: "Username or Email", type: "text" }, // updated label
        password: { label: "Password", type: "password" }
      },

      authorize: async (credentials) => {

        console.log(credentials);

        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        let user = null;

        try {
          user = await getUser('email', credentials.username);
  
          if (!user) {
            console.log('User not found');
            return null; // return null instead of throwing
          }
  
          // Check if email is verified for credentials login
          if (ENABLE_VERIFIED_BY_EMAIL) {
            if (!user.emailVerified) {
              return null;
            }
          }
  
          // Verify password
          const isValidPassword = await bcrypt.compare(
            String(credentials.password),
            String(user.password)
          );
  
          if (!isValidPassword) {
            return null;
          }
  
          // Return user object (without password)
          return {
            _id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            registrationMethod: 'credentials'
          };
        } catch (err) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        // This runs on sign in
        try {
          let userData = await getUser('email', user.email);

          // Handle credentials login - check if user needs pairing update
          if (account?.provider === 'credentials' && userData) {
            const hasGoogleId = userData.googleId;
            if (hasGoogleId && !userData.isPaired) {
              // Update pairing status since user has both credentials and Google
              const {error} = await supabase.from('users').update({
                isPaired: true
              }).eq('_id', userData._id);
            }
          }

          // If user doesn't exist in MySQL, create a new record (Google login only)
          if (!userData && account?.provider === 'google') {
            // console.log('Creating new user in MySQL for Google login:', user.email);
            
            // Prepare user data for MySQL (Google users are auto-verified)
            const newUserData = {
              _id: crypto.randomUUID(),
              email: user.email,
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              role: 'user', // Default role for new users
              emailVerified: true, // Google users are auto-verified
              registrationMethod: 'google',
              isPaired: false,
              googleId: user.id,
              creationDate: new Date()
            };

            const { error } = await supabase.from('users')
              .insert(newUserData)
          } else if (!userData && account?.provider === 'credentials') {
            // This shouldn't happen as credentials users are created via registration API
            console.error('Credentials user not found in database during sign-in:', user.email);
            throw new Error('User not found. Please register first.');
          } else if (userData) {
            // console.log('Found existing user in MySQL:', userData.email);
            
            // Handle pairing and updates for Google login
            if (account?.provider === 'google') {
              const hasPassword = userData.password && userData.password.length > 0;
              const hasGoogleId = userData.googleId;
              
              const updatedData = {
                ...userData,
                firstName: user.name?.split(' ')[0] || userData.firstName,
                lastName: user.name?.split(' ').slice(1).join(' ') || userData.lastName,
                emailVerified: true,
                googleId: user.id, // Always update Google ID
                // Update pairing status: paired if user has both Google and password
                isPaired: hasPassword ? true : userData.isPaired,
                // Update registration method if this is first Google login for a credentials user
                registrationMethod: userData.registrationMethod === 'credentials' && !hasGoogleId ? userData.registrationMethod : 'google'
              };
              
              // Only update if there are changes
              if (JSON.stringify(updatedData) !== JSON.stringify(userData)) {
                const {error} = await supabase.from('users')
                  .update(updatedData).eq('_id', userData._id);
                // console.log('Updated user data from Google login:', userData.email);
                if (hasPassword && !hasGoogleId) {
                  // console.log('🔗 User account paired: Google + credentials for', userData.email);
                }
              }
            }
          }

          if (userData) {
            token.role = userData.role || 'user';
            token.userId = userData._id; // Always use MySQL _id
            token.name = `${userData.firstName} ${userData.lastName}`;
            token.email = userData.email;
            token.emailVerified = userData.emailVerified;
          } else {
            token.role = 'user';
          }

        } catch (error) {
          console.error('Error handling user in JWT callback:', error);
          token.role = 'user';
        }
      } else if (token.userId) {
        // This runs on subsequent requests - token already has userId
        // console.log('JWT callback - existing token.userId:', token.userId);
      }

      return token;
    },
    async session({ session, token }: any) {
      // Add MySQL user data to session
      // console.log('Session callback - token.userId:', token.userId);
      if (session.user) {
        session.user.role = token.role;
        session.user._id = token.userId; // Use MySQL _id
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.emailVerified = token.emailVerified;
      }
      // console.log('Session callback - session.user._id:', session.user._id);
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  },
  events: {
    async createUser({ user }) {
      // This event is called when NextAuth creates a user
      // But we handle user creation in the JWT callback for better control
      // console.log('NextAuth createUser event triggered for:', user.email);
    },
    async signOut(event) {
      // console.log('User signed out:', event.session?.user?.email || event.token?.email);
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, ...message) {
      //console.log(code, ...message);
    },
    warn(code, ...message) {
      //console.log(code, ...message);
    },
    debug(code, ...message) {
      //console.log(code, ...message);
    }
  }
})