# BCK Digital Library

A free, mobile-friendly school digital library for GitHub Pages and Google Drive.

## Folder structure

```text
bck-digital-library/
├── index.html       # Home page
├── books.html       # Library catalogue and shelves
├── styles.css       # Shared design
└── images/
    ├── badge.png
    └── bg.jpg
```

## Add a Google Drive resource

1. Upload an approved school resource to Google Drive.
2. Set sharing to the appropriate viewer access approved by the school.
3. Open `books.html` in a text editor.
4. Find an entry in the `BOOKS` list.
5. Replace `#DRIVE_LINK_GOES_HERE` with the copied Google Drive URL.
6. Keep the URL inside single or double quotation marks.
7. Save and upload the changed file to GitHub.

Example:

```javascript
{
  cls: 'S1',
  subject: 'Mathematics',
  title: 'S1 Algebra Notes',
  author: 'BCK Mathematics Department',
  format: 'PDF',
  url: 'https://drive.google.com/file/d/FILE_ID/view'
}
```

To add more resources, duplicate an existing object inside the `BOOKS` list and change its details.

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `books.html`, `styles.css`, the `images` folder, and this README.
3. Open the repository’s **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder, then save.
6. Wait for GitHub to provide the Pages URL.

The homepage is already named `index.html`, so it will open automatically.

## Important

Only publish files the school created, owns, or has permission to share. Do not place Google passwords, API keys, student marks, phone numbers, or private student information in this project.

About and Contact pages are intentionally not included so they can be added later.
