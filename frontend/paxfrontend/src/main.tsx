import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {RouterProvider,} from "react-router-dom";
import {store} from "./app/layout/store";
import {Provider} from "react-redux";
import {router} from "./app/router";


const rootElement = document.getElementById('root');

if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
            <Provider store={store}>
                <RouterProvider router={router}/>
            </Provider>
    );

}