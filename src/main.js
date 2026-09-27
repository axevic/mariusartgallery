import matter from 'gray-matter';
import { marked } from 'marked';
import './style.css';

// Vite eagerly imports every markdown file as raw text at build time
const modules = import.meta.glob('./content/artworks/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
});

// Parse frontmatter + body out of each file
const artworks = Object.values(modules).map((raw) => {
  const { data, content } = matter(raw);
  return {
    title: data.title,
    image: data.image,
    description: content ? marked.parse(content) : (data.description || ''),
    year: data.year || '',
    medium: data.medium || '',
    date: data.date ? new Date(data.date) : new Date(0),
  };
});

// Newest first
artworks.sort((a, b) => b.date - a.date);

// Render into the gallery grid
const gallery = document.querySelector('#gallery');

gallery.innerHTML = artworks.map((art, i) => `
  <figure class="artwork-card" data-index="${i}">
    <img src="${art.image}" alt="${art.title}" loading="lazy" />
    <figcaption>
      <h3>${art.title}</h3>
      <p class="meta">${[art.year, art.medium].filter(Boolean).join(' · ')}</p>
    </figcaption>
  </figure>
`).join('');

// Simple lightbox
const lightbox = document.querySelector('#lightbox');
const lightboxImg = lightbox.querySelector('img');
const lightboxCaption = lightbox.querySelector('.lightbox-caption');
let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  const art = artworks[index];
  lightboxImg.src = art.image;
  lightboxImg.alt = art.title;
  lightboxCaption.innerHTML = `<h3>${art.title}</h3>${art.description}`;
  lightbox.classList.add('open');
}

function closeLightbox() {
  lightbox.classList.remove('open');
}

function showNext(delta) {
  currentIndex = (currentIndex + delta + artworks.length) % artworks.length;
  openLightbox(currentIndex);
}

gallery.addEventListener('click', (e) => {
  const card = e.target.closest('.artwork-card');
  if (card) openLightbox(Number(card.dataset.index));
});

lightbox.querySelector('.close').addEventListener('click', closeLightbox);
lightbox.querySelector('.prev').addEventListener('click', () => showNext(-1));
lightbox.querySelector('.next').addEventListener('click', () => showNext(1));

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showNext(-1);
  if (e.key === 'ArrowRight') showNext(1);
});