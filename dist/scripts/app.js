(() => {
    'use strict';

    var app = {
        APIUrl: 'http://cmgt.hr.nl:8000',
        isLoading: true,
        spinner: document.querySelector('#loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        tagTemplate: document.querySelector('.tagTemplate'),
        projectsContainer: document.querySelector('#projects'),
        tagsContainer: document.querySelector('#tags')
    };

    app.createTagButton = ((data) => {
        console.log('Creating tag: ', data);

        // Create new
        let tag = app.tagTemplate.cloneNode(true);
        tag.classList.remove('tagTemplate');
        tag.classList.remove('hide');
        tag.textContent = data;
        tag.addEventListener('click', (() => {
            app.getProjects(data);
        }));
        app.tagsContainer.appendChild(tag);
    });

    // Updates a project card
    app.createProjectCard = ((data) => {

        // Create new
        let card = app.cardTemplate.cloneNode(true);
        card.classList.remove('cardTemplate');
        card.classList.remove('hide');
        app.projectsContainer.appendChild(card);

        card.querySelector('.card-title').textContent = data.title;
        card.querySelector('.card-content-p').textContent = data.tagline;
        card.querySelector('.card-image-src').setAttribute('src', app.APIUrl + '/' + data.headerImage);

        // Add tags to card
        for (let tagName of data.tags) {
            let tag = app.tagTemplate.cloneNode(true);
            tag.classList.remove('tagTemplate');
            tag.classList.remove('hide');
            tag.textContent = tagName;
            tag.addEventListener('click', (() => {
                app.getProjects(tagName);
            }));
            card.querySelector('.card-action').appendChild(tag);
        }

        if (app.isLoading) {
            app.spinner.classList.add('hide');
            app.projectsContainer.classList.remove('hide');
            app.isLoading = false;
        }
    });

    app.showTags = ((tags) => {
        console.log('showTags():', tags);

        if (tags) {
            for (let tag of tags) {
                app.createTagButton(tag);
            }
        } else {
            // Unable to retrieve tags, show notice.
            app.tagsContainer.textContent = 'Unable to load Tags (offline).';

        }
    });

    app.showProjects = ((projects) => {
        console.log('showProjects():', projects);

        while (app.projectsContainer.firstChild) {
            app.projectsContainer.removeChild(app.projectsContainer.firstChild);
        }

        for (let project of projects) {
            app.createProjectCard(project);
        }
    });

    // Feches projects Tags from API
    // Strategy: NetworkFirstThenCache
    app.getTags = (() => {
        let url = app.APIUrl + '/api/projects/tags';

        // Fetch the latest data.
        console.log('[API] Fetching tags...');

        fetch(url).then(((res) => {
            console.log('Response: ', res);
            if (res.ok) {
                return res.json();
            }
            throw new Error('Network response was not ok.')
        }))
            .then(((json) => {
                console.log('Json: ', json);
                app.showTags(json.tags);
            }))
            .catch(((err) => {
                console.log('Error when fetching: ', err.message);
                // If fetching error (i.e. no internet connection or host is dead), use IndexedDb Data

                app.showTags();
            }));
    });

    // Fetches projects data from API
    // Strategy: NetworkFirstThenCache
    app.getProjects = ((tag) => {
        // If tag filter is provided, fetch by tag.
        let query = ((tag) ? '/api/projects?tag=' + tag : '/api/projects');
        let url = app.APIUrl + query;

        // Fetch the latest data.
        console.log('[API] Fetching projects...');

        fetch(url).then(((res) => {
            console.log('Response: ', res);
            if (res.ok) {
                return res.json();
            }
            throw new Error('Network response was not ok.')
        }))
            .then(((json) => {
                console.log('Json: ', json);
                if (!tag) app.saveProjects(JSON.stringify(json.projects));
                app.showProjects(json.projects);
            }))
            .catch(((err) => {
                console.log('Error when fetching: ', err.message);
                // If fetching error (i.e. no internet connection or host is dead), use IndexedDb Data

                localforage.getItem('projects')
                    .then((value) => {
                        app.showProjects(JSON.parse(value));
                        console.log('Loaded "projects" from indexedDB');
                    }).catch((err) => {
                        // If no indexedDb data is found, the user is using the app for the first time.
                        console.log('No projects data found in indexedDB.')
                    });
            }));
    });

    app.saveProjects = ((projects) => {
        localforage.setItem('projects', projects);
        console.log('Saved "projects" in indexedDB');
    });

    // Startup code
    app.getTags();
    app.getProjects();

    // Service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(function () { console.log('Service Worker Registered'); });
    }

})();