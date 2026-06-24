FROM jekyll/jekyll@sha256:400b8d1569f118bca8a3a09a25f32803b00a55d1ea241feaf5f904d66ca9c625

WORKDIR /srv/jekyll

COPY Gemfile Gemfile.lock ./

RUN bundle install --quiet --clean \
    && addgroup -g 1000 -S jekyll \
    && adduser -u 1000 -S jekyll -G jekyll \
    && chown -R jekyll:jekyll /srv/jekyll

USER jekyll

CMD ["jekyll", "serve", "--host", "0.0.0.0"]