// Single source of truth for all translation keys.
// `t(key)` is restricted to these keys at compile time, and the dev test
// asserts every locale JSON file contains exactly this set.

export const TRANSLATION_KEYS = [
  // common
  'common.cancel',
  'common.save',
  'common.delete',
  'common.edit',
  'common.loading',
  'common.clear',
  'common.close',

  // photo carousel
  'photo.counter',
  'photo.prev',
  'photo.next',

  // image picker
  'imagePicker.remove',
  'imagePicker.hint',

  // auth
  'auth.loginTitle',
  'auth.username',
  'auth.usernameTitle',
  'auth.password',
  'auth.confirmPassword',
  'auth.loginButton',
  'auth.loggingIn',
  'auth.invalidCredentials',
  'auth.loginFailed',
  'auth.noAccount',
  'auth.registerLink',
  'auth.registerTitle',
  'auth.passwordsMismatch',
  'auth.usernameTaken',
  'auth.validationError',
  'auth.registerFailed',
  'auth.registerButton',
  'auth.registering',
  'auth.haveAccount',
  'auth.loginLink',

  // nav
  'nav.userMenu',
  'nav.createPublication',
  'nav.myDrafts',
  'nav.logout',
  'nav.login',
  'nav.register',

  // theme
  'theme.light',
  'theme.system',
  'theme.dark',
  'theme.label',

  // language
  'language.label',

  // publications page
  'publications.filter',
  'publications.removeFilter',
  'publications.relatedTags',
  'publications.tagCount',
  'publications.notFound',
  'publications.loadFailed',
  'publications.showMore',
  'publications.copyLinkTitle',
  'publications.linkCopied',
  'publications.like',
  'publications.unlike',

  // sort controls
  'sort.byDate',
  'sort.byLikes',
  'sort.byRelevance',
  'sort.ascending',
  'sort.descending',

  // drafts page
  'drafts.title',
  'drafts.loadFailed',
  'drafts.empty',
  'drafts.untitled',
  'drafts.modified',

  // not found page
  'notFound.message',
  'notFound.toPublications',

  // publication create/edit form
  'publicationForm.newTitle',
  'publicationForm.draftTitle',
  'publicationForm.editTitle',
  'publicationForm.title',
  'publicationForm.text',
  'publicationForm.images',
  'publicationForm.tags',
  'publicationForm.publishImmediately',
  'publicationForm.publish',
  'publicationForm.publishing',
  'publicationForm.createFailed',
  'publicationForm.saveFailed',
  'publicationForm.deleteFailed',
  'publicationForm.deleteConfirm',

  // header search
  'search.placeholder',
  'search.close',
  'search.open',

  // header tags
  'tagsHeader.searchPlaceholder',
  'tagsHeader.close',
  'tagsHeader.open',
  'tagsHeader.nothingFound',
  'tagsHeader.clear',

  // tag input
  'tagInput.placeholder',
  'tagInput.removeTag',
  'tagInput.hint',

  // publication actions menu
  'actions.label',
  'actions.edit',
  'actions.copyLink',

  // comments
  'comments.title',
  'comments.empty',
  'comments.saving',
  'comments.save',
  'comments.cancel',
  'comments.edit',
  'comments.delete',
  'comments.reply',
  'comments.deleted',
  'comments.edited',
  'comments.actions',
  'comments.copyLink',
  'comments.copyLinkTitle',
  'comments.linkCopied',
  'comments.linked',
  'comments.deleteFailed',
  'comments.updateFailed',
  'comments.loadFailed',

  // comment form
  'commentForm.placeholder',
  'commentForm.replyPlaceholder',
  'commentForm.replyTo',
  'commentForm.cancelReply',
  'commentForm.send',
  'commentForm.postFailed',

  // share
  'share.prompt',
] as const;

export type TranslationKey = (typeof TRANSLATION_KEYS)[number];
