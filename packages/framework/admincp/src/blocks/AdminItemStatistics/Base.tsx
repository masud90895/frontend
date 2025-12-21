/* eslint-disable react/jsx-key */
import { Block, BlockContent } from '@metafox/layout';
import {
  ItemMedia,
  ItemText,
  ItemTitle,
  LineIcon,
  UIBlockViewProps,
  FormatNumberCompact
} from '@metafox/ui';
import React from 'react';
import { Box, Skeleton, styled, useMediaQuery, useTheme } from '@mui/material';
import { useGlobal } from '@metafox/framework';
import {
  Carousel,
  NextButtonCarousel,
  PrevButtonCarousel,
  EmblaCarouselType,
  useCarousel
} from '@metafox/core';

const name = 'AdminItemStatistics';

const PrevButtonStyled = styled(PrevButtonCarousel, {
  name,
  slot: 'PrevButtonStyled'
})(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  boxShadow: '1.8px 2.4px 7px 0 rgba(0, 0, 0, 0.15)',
  backgroundColor: '#fff !important',
  left: '0px',
  padding: theme.spacing(3),
  display: 'flex !important',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  zIndex: '100',
  cursor: 'pointer',
  fontSize: theme.mixins.pxToRem(18),
  color: theme.palette.text.primary,
  '&:before': {
    display: 'none !important'
  },
  '&.Mui-disabled': {
    display: 'none !important'
  },
  [theme.breakpoints.up('sm')]: {
    '&:hover': {
      color: theme.palette.primary.main
    }
  }
}));

const NextButtonStyled = styled(NextButtonCarousel, {
  name,
  slot: 'NextButtonStyled'
})(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  cursor: 'pointer',
  boxShadow: '1.8px 2.4px 7px 0 rgba(0, 0, 0, 0.15)',
  backgroundColor: '#fff !important',
  right: '0px',
  padding: theme.spacing(3),
  display: 'flex !important',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  fontSize: theme.mixins.pxToRem(18),
  color: theme.palette.text.primary,
  '&:before': {
    display: 'none !important'
  },
  '&.Mui-disabled': {
    display: 'none !important'
  },
  [theme.breakpoints.up('sm')]: {
    '&:hover': {
      color: theme.palette.primary.main
    }
  }
}));

const ItemContent = styled('div', { slot: 'ItemContent' })(({ theme }) => ({
  display: 'flex !important',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: theme.palette.background.paper,
  width: '100% !important',
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(0.5),
  height: '100%'
}));

const ItemMediaWrapper = styled(ItemMedia, { slot: 'ItemMedia' })(
  ({ theme }) => ({
    paddingRight: theme.spacing(1.5),
    '& span': {
      fontSize: '40px',
      color: '#2681d5'
    }
  })
);

const Title = styled(ItemTitle, { slot: 'ItemTitle' })(({ theme }) => ({
  '& p': {
    color: theme.palette.grey[700],
    marginTop: theme.spacing(0.5),
    fontSize: 16
  }
}));

const Value = styled('div', { slot: 'Value' })(({ theme }) => ({
  fontSize: 28,
  fontWeight: 'bold',
  color: theme.palette.grey['A700']
}));

const BlockContentWrapper = styled(BlockContent, { slot: 'BlockContent' })(
  ({ theme }) => ({
    margin: theme.spacing(0),
    padding: theme.spacing(0, 1)
  })
);

export interface Props extends UIBlockViewProps {}

export default function AdminItemStats({ blockProps, title }: Props) {
  const { useFetchDetail } = useGlobal();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
  const itemsShow = React.useMemo(() => {
    if (isSmallScreen) {
      return 2;
    }

    if (isMediumScreen) {
      return 3;
    }

    return 4;
  }, [isSmallScreen, isMediumScreen]);

  const [data, loading] = useFetchDetail({
    dataSource: {
      apiUrl: 'admincp/dashboard/item-statistic'
    }
  });
  const [carouselApi, setCarouselApi] = React.useState<EmblaCarouselType>(null);

  const onInit = (emblaApi: EmblaCarouselType) => {
    setCarouselApi(emblaApi);
  };

  const carousel = useCarousel(carouselApi);
  const settings = {
    slidesToScroll: 'auto'
  };

  if (loading) {
    return (
      <Block>
        <BlockContentWrapper>
          <Carousel itemsShow={4} gap={2} options={settings}>
            <ItemContent>
              <ItemMediaWrapper>
                <Skeleton variant="circular" width={60} height={60} />
              </ItemMediaWrapper>
              <ItemText>
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="90%" />
              </ItemText>
            </ItemContent>

            <ItemContent>
              <ItemMediaWrapper>
                <Skeleton variant="circular" width={60} height={60} />
              </ItemMediaWrapper>
              <ItemText>
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="90%" />
              </ItemText>
            </ItemContent>

            <ItemContent>
              <ItemMediaWrapper>
                <Skeleton variant="circular" width={60} height={60} />
              </ItemMediaWrapper>
              <ItemText>
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="90%" />
              </ItemText>
            </ItemContent>

            <ItemContent>
              <ItemMediaWrapper>
                <Skeleton variant="circular" width={60} height={60} />
              </ItemMediaWrapper>
              <ItemText>
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="90%" />
              </ItemText>
            </ItemContent>

            <ItemContent>
              <ItemMediaWrapper>
                <Skeleton variant="circular" width={60} height={60} />
              </ItemMediaWrapper>
              <ItemText>
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="90%" />
              </ItemText>
            </ItemContent>
          </Carousel>
        </BlockContentWrapper>
      </Block>
    );
  }

  return (
    <Block>
      <BlockContentWrapper>
        {!loading && data?.length ? (
          <Box>
            <Carousel
              itemsShow={itemsShow}
              gap={2}
              options={settings}
              onInit={onInit}
            >
              {data.map((item, index) => (
                <div key={index}>
                  <ItemContent>
                    {item.icon ? (
                      <ItemMediaWrapper>
                        <LineIcon icon={item.icon} />
                      </ItemMediaWrapper>
                    ) : null}
                    <ItemText>
                      <Value>
                        <FormatNumberCompact value={item.value} />
                      </Value>
                      <Title>{item.label}</Title>
                    </ItemText>
                  </ItemContent>
                </div>
              ))}
            </Carousel>
            <PrevButtonStyled
              iconRight="ico-arrow-right"
              iconLeft="ico-arrow-left"
              carousel={carousel}
              disableRipple
            >
              <LineIcon icon="ico-arrow-left" />
            </PrevButtonStyled>
            <NextButtonStyled
              iconRight="ico-arrow-right"
              iconLeft="ico-arrow-left"
              carousel={carousel}
              disableRipple
            >
              <LineIcon icon="ico-arrow-right" />
            </NextButtonStyled>
          </Box>
        ) : null}
      </BlockContentWrapper>
    </Block>
  );
}
