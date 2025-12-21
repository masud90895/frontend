import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Box, styled, SxProps } from '@mui/material';
import { OptionsType } from './types';
import { EmblaCarouselType } from '@metafox/core';

const name = 'CoreCarousel';

const Root = styled(Box, { name, slot: 'root' })(({ theme }) => ({
  overflow: 'hidden'
}));
const Container = styled(Box, {
  name,
  slot: 'container',
  shouldForwardProp: props => props !== 'gap' && props !== 'itemsShow'
})<{ gap?: number; itemsShow?: number }>(({ theme, gap, itemsShow }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginLeft: theme.spacing(gap * -1),
  '& > *': {
    flex: `0 0 calc(100% / ${itemsShow})`,
    paddingLeft: theme.spacing(gap),
    minWidth: 0
  }
}));

type CarouselProps = {
  children: React.ReactNode;
  sxContainer?: SxProps;
  sx?: SxProps;
  options?: OptionsType;
  plugins?: any;
  gap?: number;
  onInit?: (emblaApi: EmblaCarouselType) => void;
  itemsShow?: number;
};

function Carousel({
  children,
  sx,
  sxContainer,
  options = {},
  gap = 1,
  plugins = [],
  onInit,
  itemsShow = 1
}: CarouselProps) {
  const [carouselRef, carouselApi] = useEmblaCarousel(options, plugins);
  const refMounted = React.useRef(false);

  React.useEffect(() => {
    if (!carouselApi || refMounted.current || !onInit) return;

    refMounted.current = true;
    const onInitHandle = () => onInit(carouselApi);

    if (carouselApi) {
      onInit(carouselApi);
    }

    carouselApi.on('init', onInitHandle);

    return () => {
      carouselApi.off('init', onInitHandle);
    };
  }, [carouselApi, onInit]);

  if (!children) return null;

  return (
    <Root ref={carouselRef} sx={sx}>
      <Container gap={gap} sx={sxContainer} itemsShow={itemsShow}>
        {children}
      </Container>
    </Root>
  );
}

export default React.memo(Carousel);
