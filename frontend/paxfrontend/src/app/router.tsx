import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import { Home } from "../pages/main";
import { SettingsPage } from "../pages/settings";
import { MessagesPage } from "../pages/messages";
import { TrendingPage } from "../pages/trending";
import { GroupsPage } from "../pages/groups";
import { BookmarksPage } from "../pages/bookmarks";
import { NotificationsPage } from "../pages/notifications";
import { ProfilePage} from "../pages/profile/ui/profilePage";
import { AuthCallback } from "../features/Auth/AuthCallback";
import { GroupDetailsPage } from '../pages/groups/GroupDetailsPage';


export const router = createBrowserRouter([
    {
        path: "/",
        Component: App,
        children: [
            { index: true, element: <Home /> },

            { path: "home", element: <Home /> },
            { path: "messages", element: <MessagesPage /> },
            { path: "trending", element: <TrendingPage /> },
            { path: "groups", element: <GroupsPage /> },

            { path: "groups/:id", element: <GroupDetailsPage /> },

            { path: "bookmarks", element: <BookmarksPage /> },
            { path: "notifications", element: <NotificationsPage /> },
            { path: "profile", element: <ProfilePage />},

            { path: "settings", element: <SettingsPage /> },

            { path: "profile/:id", element: <ProfilePage />},
            { path: "auth/callback", element: <AuthCallback /> },
        ],
    },
]);